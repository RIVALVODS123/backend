/**
 * Question bank — mirrors the frontend bank so the server can score the quiz.
 * Keys: index (matching question-N-index from the form), correct answer letter.
 */
const QUESTION_BANK = [
  { correct: 'B' }, // 0
  { correct: 'C' }, // 1
  { correct: 'A' }, // 2
  { correct: 'D' }, // 3
  { correct: 'B' }, // 4
  { correct: 'C' }, // 5
  { correct: 'A' }, // 6
  { correct: 'C' }, // 7
  { correct: 'B' }, // 8
  { correct: 'C' }, // 9
  { correct: 'C' }, // 10
  { correct: 'D' }, // 11
  { correct: 'B' }, // 12
  { correct: 'C' }, // 13
  { correct: 'B' }, // 14
  { correct: 'A' }, // 15
  { correct: 'C' }, // 16
  { correct: 'B' }, // 17
  { correct: 'D' }, // 18
  { correct: 'A' }, // 19
  { correct: 'C' }, // 20
  { correct: 'D' }, // 21
  { correct: 'B' }, // 22
  { correct: 'C' }, // 23
  { correct: 'D' }, // 24
  { correct: 'D' }, // 25
  { correct: 'B' }, // 26
  { correct: 'D' }, // 27
  { correct: 'C' }, // 28
  { correct: 'B' }, // 29
  { correct: 'C' }, // 30
  { correct: 'B' }, // 31
  { correct: 'D' }, // 32
  { correct: 'A' }, // 33
  { correct: 'C' }, // 34
  { correct: 'D' }, // 35
  { correct: 'D' }, // 36
  { correct: 'B' }, // 37
  { correct: 'C' }, // 38
  { correct: 'C' }, // 39
  { correct: 'C' }, // 40
  { correct: 'B' }, // 41
  { correct: 'B' }, // 42
  { correct: 'C' }, // 43
  { correct: 'B' }, // 44
  { correct: 'B' }, // 45
  { correct: 'C' }, // 46
  { correct: 'B' }, // 47
  { correct: 'B' }, // 48
  { correct: 'B' }, // 49
  { correct: 'B' }, // 50
  { correct: 'B' }, // 51
  { correct: 'B' }, // 52
  { correct: 'B' }, // 53
  { correct: 'B' }, // 54
  { correct: 'B' }, // 55
  { correct: 'B' }, // 56
  { correct: 'B' }, // 57
  { correct: 'B' }, // 58
  { correct: 'B' }, // 59
  { correct: 'C' }, // 60
  { correct: 'B' }, // 61
  { correct: 'B' }, // 62
  { correct: 'B' }, // 63
  { correct: 'B' }, // 64
  { correct: 'B' }, // 65
  { correct: 'C' }, // 66
  { correct: 'B' }, // 67
  { correct: 'B' }, // 68
  { correct: 'B' }, // 69
  { correct: 'B' }, // 70
  { correct: 'B' }, // 71
  { correct: 'B' }, // 72
  { correct: 'B' }, // 73
  { correct: 'B' }, // 74
  { correct: 'B' }, // 75
  { correct: 'B' }, // 76
  { correct: 'B' }, // 77
  { correct: 'B' }, // 78
  { correct: 'B' }, // 79
];

/**
 * Score 10 quiz answers against the question bank.
 * @param {Array<{questionIndex: number, answer: string}>} answers
 * @returns {{ score: number, detail: Array }}
 */
function scoreQuiz(answers) {
  let score = 0;
  const detail = answers.map(({ questionIndex, answer }) => {
    const entry = QUESTION_BANK[questionIndex];
    const correct = entry ? entry.correct : null;
    const isCorrect = correct !== null && answer === correct;
    if (isCorrect) score++;
    return { questionIndex, answer, correct, isCorrect };
  });
  return { score, detail };
}

module.exports = { scoreQuiz };
