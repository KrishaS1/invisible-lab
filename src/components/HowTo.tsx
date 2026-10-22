export function HowTo({ steps }: { steps: string[] }) {
  return (
    <ol className="howto">
      {steps.map((step, index) => (
        <li key={step}>
          <span>{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
