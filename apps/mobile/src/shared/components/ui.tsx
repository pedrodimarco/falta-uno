import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { theme } from "../theme";

export function Title({ children }: PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}
export function Body({ children }: PropsWithChildren) {
  return <Text style={styles.body}>{children}</Text>;
}
export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Notice({ message }: { message: string }) {
  return message ? (
    <View accessibilityRole="alert" style={styles.notice}>
      <Text style={styles.error}>{message}</Text>
    </View>
  ) : null;
}
export function Loading() {
  return (
    <ActivityIndicator
      accessibilityLabel="Cargando"
      color={theme.colors.primary}
      size="large"
      style={{ margin: 24 }}
    />
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && { color: theme.colors.primary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.muted}
        {...props}
        style={[
          styles.input,
          props.multiline && { minHeight: 96, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Choices<T extends string>({
  values,
  value,
  onChange,
}: {
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choices}>
      {values.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === item }}
          onPress={() => onChange(item)}
          style={[styles.choice, value === item && styles.selected]}
        >
          <Text
            style={{
              color: value === item ? "white" : theme.colors.primary,
              fontWeight: "600",
            }}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.7,
  },
  body: { fontSize: 16, lineHeight: 24, color: theme.colors.muted },
  label: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  notice: {
    backgroundColor: theme.colors.dangerSoft,
    padding: 14,
    borderRadius: 12,
  },
  error: { color: theme.colors.danger, fontSize: 15, lineHeight: 22 },
  button: {
    minHeight: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: theme.colors.primarySoft },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    minHeight: 50,
    color: theme.colors.text,
  },
  choices: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  choice: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  selected: { backgroundColor: theme.colors.primary },
});
