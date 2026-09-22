"use client";

import { useEffect, useId, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  HighlightStyle,
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import type { Limbaj } from "@/lib/exercitii/motor";
import { tags } from "@lezer/highlight";

/**
 * Editorul de cod. Culorile vin din tokenuri (principiul 9) — o temă nouă
 * schimbă doar valorile din `globals.css`, nu fișierul ăsta.
 *
 * `Tab` nu indentează dinadins: mută focalizarea mai departe, ca cine merge din
 * tastatură să poată ieși din editor. Indentarea se face cu spații, iar linia
 * de după `:` se indentează singură.
 */
const culori = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword], color: "var(--tema-cod-cuvant)" },
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName)], color: "var(--tema-cod-nume)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--tema-cod-sir)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--tema-cod-numar)" },
  { tag: tags.comment, color: "var(--tema-cod-comentariu)", fontStyle: "italic" },
  { tag: tags.atom, color: "var(--tema-cod-numar)" },
]);

const infatisare = EditorView.theme({
  "&": {
    backgroundColor: "var(--tema-sticla)",
    color: "var(--tema-text)",
    fontSize: "0.875rem",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily: "var(--tema-font-mono)",
    padding: "1rem 0",
    caretColor: "var(--tema-text)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--tema-sticla)",
    color: "var(--tema-text-slab)",
    border: "none",
    fontFamily: "var(--tema-font-mono)",
  },
  ".cm-activeLine": { backgroundColor: "var(--tema-cod-rand-activ)" },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--tema-cod-rand-activ)",
    color: "var(--tema-text)",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--tema-text)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "color-mix(in oklch, var(--tema-accent) 30%, transparent)",
    },
  ".cm-scroller": { lineHeight: "1.6" },
});

/** Colorarea sintaxei, după motorul pe care rulează exercițiul. */
function dupaLimbaj(limbaj: Limbaj) {
  return limbaj === "sql"
    ? sql({ dialect: PostgreSQL, upperCaseKeywords: true })
    : python();
}

export function EditorCod({
  eticheta,
  ajutor,
  valoare,
  onSchimba,
  limbaj = "python",
  dezactivat = false,
}: {
  eticheta: string;
  ajutor?: string;
  valoare: string;
  onSchimba: (cod: string) => void;
  limbaj?: Limbaj;
  dezactivat?: boolean;
}) {
  const gazda = useRef<HTMLDivElement>(null);
  const vedere = useRef<EditorView | null>(null);
  const scrie = useRef(onSchimba);
  const editabil = useRef(new Compartment());
  const limba = useRef(new Compartment());
  const idEticheta = useId();

  // Editorul se construiește o dată; ca să nu-l refacem la fiecare tastă,
  // funcția de scriere se ține într-un ref, împrospătat după fiecare randare.
  useEffect(() => {
    scrie.current = onSchimba;
  });

  useEffect(() => {
    if (!gazda.current) return;

    const vedereNoua = new EditorView({
      parent: gazda.current,
      state: EditorState.create({
        doc: valoare,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          history(),
          indentOnInput(),
          bracketMatching(),
          indentUnit.of("    "),
          limba.current.of(dupaLimbaj(limbaj)),
          syntaxHighlighting(culori),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          infatisare,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-labelledby": idEticheta }),
          editabil.current.of(EditorView.editable.of(true)),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) scrie.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    vedere.current = vedereNoua;

    return () => {
      vedereNoua.destroy();
      vedere.current = null;
    };
    // Se construiește o dată; textul și starea vin prin efectele de mai jos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Textul venit din afară (alt exercițiu ales, „începe de la codul dat").
  useEffect(() => {
    const v = vedere.current;
    if (!v || v.state.doc.toString() === valoare) return;
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: valoare },
    });
  }, [valoare]);

  useEffect(() => {
    vedere.current?.dispatch({
      effects: editabil.current.reconfigure(
        EditorView.editable.of(!dezactivat),
      ),
    });
  }, [dezactivat]);

  // Aceeași fereastră de editor slujește și un capitol de Python, și unul de
  // SQL: la trecerea dintr-unul în altul se schimbă doar colorarea.
  useEffect(() => {
    vedere.current?.dispatch({
      effects: limba.current.reconfigure(dupaLimbaj(limbaj)),
    });
  }, [limbaj]);

  return (
    <div className="flex flex-col gap-2">
      <span id={idEticheta} className="text-sm font-medium">
        {eticheta}
      </span>
      <div
        ref={gazda}
        className={`min-h-48 overflow-hidden rounded-tema border border-contur bg-sticla focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
          dezactivat ? "opacity-70" : ""
        }`}
      />
      {ajutor ? <p className="text-sm text-text-slab">{ajutor}</p> : null}
    </div>
  );
}
