// Renders text with **bold** support, without using innerHTML.
export function Rich({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

// A field can be one string or an array of paragraphs.
export function Paragraphs({ value }) {
  const list = Array.isArray(value) ? value : [value];
  return list.map((text, i) => (
    <p key={i}>
      <Rich text={text} />
    </p>
  ));
}
