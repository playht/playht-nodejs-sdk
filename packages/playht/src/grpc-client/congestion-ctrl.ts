/**
 * Enumerates a streaming congestion control algorithms, used to optimize the rate at which text is sent to PlayHT.
 */
export type CongestionCtrl =
  /**
   * The client will not do any congestion control.  Text will be sent to PlayHT as fast as possible.
   */
  | 'Off'

  /**
   * The client will optimize for minimizing the number of physical resources required to handle a single stream.
   *
   * If you're using PlayHT On-Prem, you should use this {@link CongestionCtrl} algorithm.
   */
  | 'StaticMar2024';
