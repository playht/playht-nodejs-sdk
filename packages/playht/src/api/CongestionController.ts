import { CongestionCtrl } from '../index';

/**
 * Responsible for optimizing the rate at which text is sent to the underlying API endpoint, according to the
 * specified {@link CongestionCtrl} algorithm.  {@link CongestionController} is essentially a task queue
 * that throttles the parallelism of, and delay between, task execution.
 *
 * The primary motivation for this (as of 2024/02/28) is to protect PlayHT On-Prem appliances
 * from being inundated with a burst of text-to-speech requests that it can't satisfy.  Prior to the introduction
 * of {@link CongestionController} (and more generally {@link CongestionCtrl}), the client would split
 * a text stream into two text chunks (referred to as "sentences") and send them to the API client (i.e. gRPC client)
 * simultaneously.  This would routinely overload on-prem appliances that operate without a lot of GPU capacity headroom[1].
 *
 * The result would be that most requests that clients sent would immediately result in a gRPC error 8: RESOURCE_EXHAUSTED;
 * and therefore, a bad customer experience.  {@link CongestionController}, if configured with {@link CongestionCtrl#StaticMar2024},
 * will now delay sending subsequent text chunks (i.e. sentences) to the gRPC client until audio for the preceding text
 * chunk has started streaming.
 *
 * The current {@link CongestionCtrl} algorithm ({@link CongestionCtrl#StaticMar2024}) is very simple and leaves a lot to
 * be desired.  We should iterate on these algorithms.  The {@link CongestionCtrl} enum was added so that algorithms
 * can be added without requiring customers to change their code much.
 *
 * [1] Customers tend to be very cost sensitive regarding expensive GPU capacity, and therefore want to keep their appliances
 * running near 100% utilization.
 *
 * --mtp@2024/02/28
 *
 * This class is largely inert if the specified {@link CongestionCtrl} is {@link CongestionCtrl#Off}.
 */
export class CongestionController {
  algo: CongestionCtrl;
  taskQ: Array<Task> = [];
  inflight = 0;
  parallelism: number;
  postChunkBackoff: number;

  constructor(algo: CongestionCtrl) {
    this.algo = algo;
    switch (algo) {
      case CongestionCtrl.Off:
        this.parallelism = Infinity;
        this.postChunkBackoff = 0;
        break;
      case CongestionCtrl.StaticMar2024:
        this.parallelism = 1;
        this.postChunkBackoff = 50;
        break;
      default:
        throw new Error(`Unrecognized congestion control algorithm: ${algo}`);
    }
  }

  enqueue(task: () => void, name: string) {
    // if congestion control is turned off - just execute the task immediately
    if (this.algo == CongestionCtrl.Off) {
      task();
      return;
    }

    this.taskQ.push(new Task(task, name));
    this.maybeDoMore();
  }

  private maybeDoMore() {
    // if congestion control is turned off - there's nothing to do here because all tasks were executed immediately
    if (this.algo == CongestionCtrl.Off) return;

    while (true) {
      if (this.inflight >= this.parallelism) return;
      if (this.taskQ.length == 0) return;
      const task = this.taskQ.shift()!;
      this.inflight++;
      //console.debug(`[PlayHT SDK] Started congestion control task: ${task.name}.  inflight=${this.inflight}`);
      task.fn();
    }
  }

  audioRecvd() {
    // if congestion control is turned off - there's nothing to do here because all tasks were executed immediately
    if (this.algo == CongestionCtrl.Off) return;

    this.inflight = Math.max(this.inflight - 1, 0);
    //console.debug('[PlayHT SDK] Congestion control received audio');
    setTimeout(() => {
      this.maybeDoMore();
    }, this.postChunkBackoff);
  }
}

/**
 * NOTE:
 *
 * {@link #name} is currently unused, but exists so that we can log task names during development.
 * Without {@link #name}, it's hard to understand which tasks were executed and in which order.
 */
class Task {
  constructor(
    public fn: () => void,
    public name: string,
  ) {}
}
