export function ChoiceIndicator() {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-steel-light bg-white transition-colors group-has-checked:border-barbicide"
    >
      <span className="size-2.5 scale-0 rounded-full bg-barbicide transition-transform group-has-checked:scale-100" />
    </span>
  );
}
