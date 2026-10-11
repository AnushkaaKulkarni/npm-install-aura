import type { TutorLesson } from './types'

const labels: Record<TutorLesson['language'], { lesson: string; intro: string; concepts: string; examples: string; summary: string; topic: string; definition: string }> = {
  English: { lesson: 'AI Tutor lesson', intro: 'Introduction', concepts: 'Key concepts and definitions', examples: 'Examples', summary: 'Summary', topic: 'Topic', definition: 'Definition' },
  Hindi: { lesson: '\u090f\u0906\u0908 \u091f\u094d\u092f\u0942\u091f\u0930 \u092a\u093e\u0920', intro: '\u092a\u0930\u093f\u091a\u092f', concepts: '\u092e\u0941\u0916\u094d\u092f \u0905\u0935\u0927\u093e\u0930\u0923\u093e\u090f\u0901 \u0914\u0930 \u092a\u0930\u093f\u092d\u093e\u0937\u093e\u090f\u0901', examples: '\u0909\u0926\u093e\u0939\u0930\u0923', summary: '\u0938\u093e\u0930\u093e\u0902\u0936', topic: '\u0935\u093f\u0937\u092f', definition: '\u092a\u0930\u093f\u092d\u093e\u0937\u093e' },
  Marathi: { lesson: '\u090f\u0906\u0908 \u091f\u094d\u092f\u0942\u091f\u0930 \u0927\u0921\u093e', intro: '\u092a\u0930\u093f\u091a\u092f', concepts: '\u092e\u0941\u0916\u094d\u092f \u0938\u0902\u0915\u0932\u094d\u092a\u0928\u093e \u0906\u0923\u093f \u0935\u094d\u092f\u093e\u0916\u094d\u092f\u093e', examples: '\u0909\u0926\u093e\u0939\u0930\u0923\u0947', summary: '\u0938\u093e\u0930\u093e\u0902\u0936', topic: '\u0935\u093f\u0937\u092f', definition: '\u0935\u094d\u092f\u093e\u0916\u094d\u092f\u093e' },
}

const devanagari = /[\u0900-\u097f\u1cd0-\u1cff\ua8e0-\ua8ff]/u

function splitByScript(value: string): Array<{ text: string; font: 'NotoLatin' | 'NotoDevanagari' }> {
  const runs: Array<{ text: string; font: 'NotoLatin' | 'NotoDevanagari' }> = []
  // Keep each uninterrupted script run together so font shaping can form conjuncts and matras.
  for (const part of value.split(/([\u0900-\u097f\u1cd0-\u1cff\ua8e0-\ua8ff]+)/u)) {
    if (!part) continue
    const font = devanagari.test(part) ? 'NotoDevanagari' : 'NotoLatin'
    const previous = runs.at(-1)
    if (previous?.font === font) previous.text += part
    else runs.push({ text: part, font })
  }
  return runs
}

function filenameFor(topic: string): string {
  const cleaned = topic.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 80)
  return `${cleaned || 'ai-tutor-notes'}.pdf`
}

export type TutorPdfFontSources = {
  devanagariRegular: string
  devanagariBold: string
  latinRegular: string
  latinBold: string
}

const publicFonts: TutorPdfFontSources = {
  devanagariRegular: '/fonts/noto-sans-devanagari-400.woff',
  devanagariBold: '/fonts/noto-sans-devanagari-700.woff',
  latinRegular: '/fonts/noto-sans-latin-400.woff',
  latinBold: '/fonts/noto-sans-latin-700.woff',
}

/** Build a PDF from the complete lesson, independent of the current playback position. */
export async function generateTutorNotesPdf(lesson: TutorLesson, fontSources: TutorPdfFontSources = publicFonts): Promise<Blob> {
  if (!lesson.topic.trim() || !lesson.introduction.trim() || !lesson.sections.length || !lesson.concepts.length || !lesson.examples.length || !lesson.summary.trim()) {
    throw new Error('The complete lesson is not available yet. Please wait for the lesson to finish loading.')
  }

  const [{ Document, Font, Page, pdf, StyleSheet, Text, View }, React] = await Promise.all([
    import('@react-pdf/renderer'),
    import('react'),
  ])

  Font.register({ family: 'NotoDevanagari', src: fontSources.devanagariRegular, fontWeight: 400 })
  Font.register({ family: 'NotoDevanagari', src: fontSources.devanagariBold, fontWeight: 700 })
  Font.register({ family: 'NotoLatin', src: fontSources.latinRegular, fontWeight: 400 })
  Font.register({ family: 'NotoLatin', src: fontSources.latinBold, fontWeight: 700 })

  const h = React.createElement as (...args: any[]) => React.ReactElement
  const styles = StyleSheet.create({
    page: { paddingTop: 48, paddingBottom: 52, paddingHorizontal: 52, color: '#172033', fontSize: 10.5, lineHeight: 1.55, fontFamily: 'NotoLatin', backgroundColor: '#ffffff' },
    top: { marginBottom: 22, paddingBottom: 17, borderBottomWidth: 2, borderBottomColor: '#6657e8' },
    eyebrow: { fontSize: 8, color: '#6657e8', letterSpacing: 1.2, marginBottom: 8, fontWeight: 700 },
    title: { fontSize: 23, lineHeight: 1.3, color: '#111827', fontWeight: 700, marginBottom: 7 },
    meta: { fontSize: 9, color: '#65718a' },
    section: { marginBottom: 15 },
    heading: { fontSize: 13, lineHeight: 1.45, color: '#342a91', fontWeight: 700, marginBottom: 6, minPresenceAhead: 38 },
    body: { fontSize: 10.5, lineHeight: 1.65, color: '#263248' },
    subheading: { fontSize: 10.5, lineHeight: 1.5, fontWeight: 700, color: '#172033', marginBottom: 2 },
    concept: { marginBottom: 9, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#d8d4ff' },
    example: { marginBottom: 8, paddingLeft: 5 },
    footer: { position: 'absolute', bottom: 22, left: 52, right: 52, borderTopWidth: 1, borderTopColor: '#e6e9f0', paddingTop: 8, color: '#7a8498', fontSize: 8, flexDirection: 'row', justifyContent: 'space-between' },
  })

  const localized = labels[lesson.language]
  const text = (value: string, style: object, key?: string) => h(Text, { key, style }, splitByScript(value).map((run, index) => h(Text, { key: `${key ?? 'text'}-${index}`, style: { fontFamily: run.font } }, run.text)))
  const section = (heading: string, content: string, key: string) => h(View, { key, style: styles.section }, text(heading, styles.heading, `${key}-heading`), text(content, styles.body, `${key}-body`))
  const page = h(Page, { size: 'A4', style: styles.page, wrap: true },
    h(View, { style: styles.top },
      text(localized.lesson.toUpperCase(), styles.eyebrow, 'eyebrow'),
      text(lesson.topic, styles.title, 'topic'),
      text(`${lesson.language}  ·  ${lesson.duration} minutes`, styles.meta, 'meta'),
    ),
    section(localized.intro, lesson.introduction, 'introduction'),
    ...lesson.sections.map((item, index) => section(item.heading, item.narration, `section-${index}`)),
    h(View, { key: 'concepts', style: styles.section },
      text(localized.concepts, styles.heading, 'concepts-heading'),
      ...lesson.concepts.map((item, index) => h(View, { key: `concept-${index}`, style: styles.concept },
        text(item.term, styles.subheading, `concept-term-${index}`),
        text(item.definition, styles.body, `concept-definition-${index}`),
      )),
    ),
    h(View, { key: 'examples', style: styles.section },
      text(localized.examples, styles.heading, 'examples-heading'),
      ...lesson.examples.map((item, index) => text(`${index + 1}.  ${item}`, { ...styles.body, ...styles.example }, `example-${index}`)),
    ),
    section(localized.summary, lesson.summary, 'summary'),
    h(View, { fixed: true, style: styles.footer },
      text(lesson.topic, styles.meta, 'footer-topic'),
      h(Text, { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` }),
    ),
  )

  const doc = h(Document, { title: `${lesson.topic} - ${localized.lesson}`, language: lesson.language === 'English' ? 'en' : lesson.language === 'Hindi' ? 'hi' : 'mr', author: 'AI Tutor' }, page) as React.ReactElement<any>
  const blob = await pdf(doc).toBlob()
  if (!blob.size || blob.type !== 'application/pdf') throw new Error('The PDF could not be generated. Please try again.')
  return blob
}

/** Build and download structured notes from the complete generated lesson. */
export async function downloadTutorNotesPdf(lesson: TutorLesson): Promise<void> {
  const blob = await generateTutorNotesPdf(lesson)
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filenameFor(lesson.topic)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
