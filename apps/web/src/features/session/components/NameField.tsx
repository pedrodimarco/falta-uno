export function NameField({
  name,
  onNameChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
}) {
  return (
    <label>
      Tu nombre
      <input
        autoComplete="nickname"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        minLength={2}
        maxLength={60}
        required
        placeholder="Cómo te conocen tus amigos"
      />
      <span className="help">Este es el nombre que ven tus amigos.</span>
    </label>
  );
}
