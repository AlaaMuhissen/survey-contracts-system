import React from "react";

import {
  Document, Page, Text, View, StyleSheet, Svg, Path, pdf, Font
} from "@react-pdf/renderer";
import type { Stroke, SigMeta } from "./SignaturePad";

/* ✅ Register Hebrew font (NOT an image) */
Font.register({
  family: "NotoSansHebrew",
  fonts: [
    { src: "/fonts/NotoSansHebrew-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/NotoSansHebrew-Bold.ttf",    fontWeight: "bold"   },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: "NotoSansHebrew" },
  rowRtl: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    marginBottom: 8,           // a touch more space between rows
  },
    labelRtl: {
    width: 120,
    textAlign: "right",
    color: "#111",
    marginLeft: 10,            // ⬅️ gap between label and the value line
  },
  sectionTitle: { marginTop: 10, marginBottom: 4, fontSize: 12, fontWeight: "bold", textAlign: "right" },
  headerBorder: { borderBottomWidth: 0.5, borderColor: "#000", paddingBottom: 8, marginBottom: 10 },
    valueLine: {
    borderBottomWidth: 0.5,
    borderColor: "#000",
    flexGrow: 1,
    minHeight: 14,
    display: "flex",
    flexDirection: "row",     // keep a row container
    alignItems: "flex-end",   // baseline on the bottom line
  },
  valueTextRtl: {
    width: "78%",            // ⬅️ crucial: let text span the whole line
    textAlign: "right",       // ⬅️ now right-align works
    direction: "rtl", 
    marginRight : 30       // ⬅️ bidi shaping & punctuation placement
  },
});

/* RTL field */
function FieldRTL({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowRtl}>
      <Text style={styles.labelRtl}>{label}</Text>
      <View style={styles.valueLine}>
        <Text style={styles.valueTextRtl}>{value || "\u00A0"}</Text>
      </View>
    </View>
  );
}


// Lined area that actually writes on the lines (RTL, no images)
function LinedAreaPDF({
  label,
  value,
  rows = 6,
}: {
  label: string;
  value: string;
  rows?: number;
}) {
  const lineH = 22;
  const valueLines = (value || "").split(/\r?\n/);

  return (
    <View wrap={false} style={{ marginBottom: 15 }}>
      {/* Label */}
      <Text style={{ textAlign: "right" }}>{label}</Text>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            height: lineH,
            justifyContent: "flex-end",
            borderBottomWidth: 0.8,
            borderColor: "#000",
            paddingRight: 6,     // gutter from the label column
          }}
        >
          <Text
            style={{
              width: "100%",
              textAlign: "right",
              direction: "rtl",
            }}
          >
            {valueLines[i] || "\u00A0"}
          </Text>
        </View>
      ))}
    </View>
  );
}





function strokesToPath(strokes: Stroke[]): string {
  const parts: string[] = [];
  for (const s of strokes) {
    if (!s.length) continue;
    parts.push(`M ${s[0].x} ${s[0].y}`);
    for (let i = 1; i < s.length; i++) parts.push(`L ${s[i].x} ${s[i].y}`);
  }
  return parts.join(" ");
}

export type WorkLogForm = {
  src: string;
  number: string;
  date: string;
  company: string;
  project: string;
  manager: string;
  teamLead: string;
  helper1: string;
  helper2: string;
  workDesc: string;
  notes: string;
};

export async function generateWorkLogPdfBlob(
  form: WorkLogForm,
  sigManager: Stroke[],
  sigLead: Stroke[],
  sigMeta: SigMeta,
) {
  const mPath = strokesToPath(sigManager);
  const lPath = strokesToPath(sigLead);
  // למעלה בקובץ (אפשר גם בתוך הפונקציה)
const todayHe = new Date().toLocaleDateString("he-IL");
const dateToShow = form.date?.trim() ? form.date : todayHe;


  const doc = (
    <Document>
      {/* ✅ direction: 'rtl' ensures correct Hebrew shaping/order */}
      <Page size="A4" style={[styles.page, { direction: "rtl" }]}>
        {/* Header (use row-reverse where needed) */}
        <View style={[styles.headerBorder, { flexDirection: "row-reverse", alignItems: "center" }]}>
  <View
    style={{
      width: 64,
      height: 64,
      borderWidth: 1,
      borderRadius: 64,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    }}
  >
    <Text>לוגו</Text>
  </View>

  {/* טקסט חברה – בלי flex:1 כדי שלא יתמתח */}
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      // שים לב: אין flex: 1 כאן!
    }}
  >
    <Text style={{ fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
      טרווארס מדידות
    </Text>
    <Text style={{ fontSize: 10, textAlign: "center" }}>אל-אנסאר 25, ירושלים</Text>
    <Text style={{ fontSize: 10, textAlign: "center" }}>054-7312492</Text>
  </View>

           <View style={{ alignItems: "flex-start", marginRight: 225 }}>
                <View style={{ borderWidth: 1, paddingVertical: 4, paddingHorizontal: 8 }}>
                <Text>עוסק מורשה</Text>
                <Text>301156782</Text>
                </View>
                <Text style={{ fontSize: 10 }}>{form.src}</Text>
            </View>
        </View>

        {/* Title row */}
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
          <Text style={{ fontSize: 10 }}>מקור</Text>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>יומן עבודה</Text>
          <View style={{ flexDirection: "row-reverse", alignItems: "flex-end", gap: 6 }}>
            <Text style={{ fontSize: 10 }}>מס'</Text>
            <View
                style={{
                    borderBottomWidth: 0.5,
                    borderColor: "#000",
                    width: 60,             
                    paddingHorizontal: 4,
                    justifyContent: "flex-end",
                }}
                >
                <Text
                    style={{
                    width: "100%",  
                    textAlign: "center",
                    direction: "rtl",
                    }}
                >
                    {form.number || "\u00A0"}
                </Text>
                </View>
          </View>
        </View>

        {/* Date */}
        {/* שורת תאריך – RTL, מיושר ימין, עם ברירת מחדל */}
        <View
        style={{
            flexDirection: "row-reverse",
            alignItems: "flex-end",
            marginBottom: 8,
        }}
        >
        {/* תווית "תאריך" בצד ימין */}
        <Text style={{ fontSize: 10, marginLeft: 6 }}>תאריך</Text>

        {/* תיבה עם קו תחתון בצד שמאל של התווית */}
        <View
            style={{
            borderBottomWidth: 0.5,
            borderColor: "#000",
            width: 90,              // רוחב קבוע הכי פשוט
            paddingRight: 2,        // רווח קטן מהקצה הימני של התיבה
            justifyContent: "flex-end",
            }}
        >
            <Text
            style={{
                width: "100%",        // חובה כדי ש-textAlign יעבוד
                textAlign: "right",
                direction: "rtl",
            }}
            >
            {dateToShow}
            </Text>
        </View>
        </View>


        {/* Company */}
        <Text style={styles.sectionTitle}>פרטי החברה</Text>
        <FieldRTL label="חברה" value={form.company} />
        <FieldRTL label="פרויקט" value={form.project} />
        <FieldRTL label="מנהל עבודה" value={form.manager} />

        {/* Team */}
        <Text style={styles.sectionTitle}>פרטי צוות מדידה</Text>
        <FieldRTL label="ראש צוות" value={form.teamLead} />
        <FieldRTL label="עוזר" value={form.helper1} />
        <FieldRTL label="עוזר" value={form.helper2} />

        {/* Areas */}
        <LinedAreaPDF label="תיאור עבודה" value={form.workDesc} rows={8} />
        <LinedAreaPDF label="הערות" value={form.notes} rows={5} />

        {/* Signatures (unchanged; still vector) */}
        <View style={{ flexDirection: "row-reverse", gap: 24, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Svg width="100%" height="70" viewBox={`0 0 ${Math.max(sigMeta.w,1)} ${Math.max(sigMeta.h,1)}`}>
              <Path d={mPath || "M 0 0"} stroke="#000" strokeWidth={2} fill="none" />
            </Svg>
            <View style={{ borderTopWidth: 1, borderColor: "#000", marginTop: 2 }} />
            <Text style={{ textAlign: "center" }}>חתימת מנהל</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Svg width="100%" height="70" viewBox={`0 0 ${Math.max(sigMeta.w,1)} ${Math.max(sigMeta.h,1)}`}>
              <Path d={lPath || "M 0 0"} stroke="#000" strokeWidth={2} fill="none" />
            </Svg>
            <View style={{ borderTopWidth: 1, borderColor: "#000", marginTop: 2 }} />
            <Text style={{ textAlign: "center" }}>חתימת ראש צוות</Text>
          </View>
        </View>

        {/* Watermark */}
        <View style={{ position: "absolute", left: 0, right: 0, top: "45%", alignItems: "center", opacity: 0.1 }}>
          <Text style={{ fontSize: 48 }}>GIS</Text>
        </View>
      </Page>
    </Document>
  );

  return await pdf(doc).toBlob();
}



