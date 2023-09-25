export function Select({
  label,
  id,
  options,
  value,
  onChange,
}: {
  label: string;
  id: string;
  options: { name: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2"
      >
        <span>{label}</span>
      </label>
      <select
        id={id}
        name={id}
        onChange={(e) => onChange(e.target.value)}
        value={value}
        className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:text-gray-100 dark:bg-black dark:ring-gray-900 "
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
