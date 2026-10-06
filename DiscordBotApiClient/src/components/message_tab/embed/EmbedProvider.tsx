import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EmbedField, EmbedPropertyKey, EmbedState } from "./types";

const DEFAULTS: Record<EmbedPropertyKey, () => EmbedState[keyof EmbedState]> = {
  title: () => "",
  description: () => "",
  url: () => "",
  timestamp: () => null,
  color: () => "#06D6A0",
  footer: () => ({ text: "", iconUrl: "" }),
  image: () => ({ url: "" }),
  thumbnail: () => ({ url: "" }),
  author: () => ({ name: "", url: "", iconUrl: "" }),
  fields: () => [],
};

const MAX_FIELDS = 5;

type EmbedContextValue = {
  embed: EmbedState;
  addProperty: (key: EmbedPropertyKey) => void;
  removeProperty: (key: EmbedPropertyKey) => void;
  updateProperty: <K extends keyof EmbedState>(
    key: K,
    value: EmbedState[K],
  ) => void;
  addField: () => void;
  removeField: (index: number) => void;
  updateField: (index: number, patch: Partial<EmbedField>) => void;
  clear: () => void;
};

const EmbedContext = createContext<EmbedContextValue | null>(null);

export function EmbedProvider({ children }: { children: ReactNode }) {
  const [embed, setEmbed] = useState<EmbedState>({});

  const addProperty = useCallback((key: EmbedPropertyKey) => {
    setEmbed((prev) => {
      if (key === "fields") {
        return {
          ...prev,
          fields: [
            ...(prev.fields ?? []),
            { name: "", value: "", inline: false },
          ],
        };
      }
      if (prev[key] !== undefined) return prev;
      return { ...prev, [key]: DEFAULTS[key]() };
    });
  }, []);

  const removeProperty = useCallback((key: EmbedPropertyKey) => {
    setEmbed((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const updateProperty = useCallback(
    <K extends keyof EmbedState>(key: K, value: EmbedState[K]) => {
      setEmbed((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addField = useCallback(() => {
    setEmbed((prev) => {
      const current = prev.fields ?? [];
      if (current.length >= MAX_FIELDS) return prev;
      return {
        ...prev,
        fields: [...current, { name: "", value: "", inline: false }],
      };
    });
  }, []);

  const removeField = useCallback((index: number) => {
    setEmbed((prev) => ({
      ...prev,
      fields: (prev.fields ?? []).filter((_, i) => i !== index),
    }));
  }, []);

  const updateField = useCallback(
    (index: number, patch: Partial<EmbedField>) => {
      setEmbed((prev) => ({
        ...prev,
        fields: (prev.fields ?? []).map((f, i) =>
          i === index ? { ...f, ...patch } : f,
        ),
      }));
    },
    [],
  );

  const clear = useCallback(() => setEmbed({}), []);

  const value = useMemo<EmbedContextValue>(
    () => ({
      embed,
      addProperty,
      removeProperty,
      updateProperty,
      addField,
      removeField,
      updateField,
      clear,
    }),
    [
      embed,
      addProperty,
      removeProperty,
      updateProperty,
      addField,
      removeField,
      updateField,
      clear,
    ],
  );

  return (
    <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>
  );
}

export function useEmbed() {
  const ctx = useContext(EmbedContext);
  if (!ctx) throw new Error("useEmbed must be used inside <EmbedProvider>");
  return ctx;
}
