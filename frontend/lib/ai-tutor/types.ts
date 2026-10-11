export type TutorLanguage = 'English' | 'Hindi' | 'Marathi'
export type TutorDuration = 5 | 10 | 15 | 20

export type TutorSessionConfig = {
  topic: string
  language: TutorLanguage
  duration: TutorDuration
}

export type TutorLesson = TutorSessionConfig & {
  introduction: string
  sections: Array<{ heading: string; narration: string }>
  concepts: Array<{ term: string; definition: string }>
  examples: string[]
  summary: string
  wordCount: number
}
