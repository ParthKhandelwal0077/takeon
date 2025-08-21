interface Question {
    id: number;
    text: string;
    answer: string;
  }
  
  export default function getMockQuestions(): Question[] {
    return [
      { id: 1, text: 'What is the capital of France?', answer: 'Paris' },
      { id: 2, text: 'What is 5 + 7?', answer: '12' },
      { id: 3, text: 'Fill in the blank: The ___ is the powerhouse of the cell.', answer: 'mitochondria' },
    ];
  }
