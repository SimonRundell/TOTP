/** Captions for step-through mode, one per pipeline stage, written for Level 3 learners. */
export const steps = [
  {
    id: 1,
    title: 'The shared secret',
    body: 'Your phone and the server both hold the same secret key. It was passed across once, usually in a QR code. Base32 is just a way of writing those bytes using letters and digits that are hard to mix up.',
    question: 'Why does the alphabet leave out 0, 1, 8 and 9?',
  },
  {
    id: 2,
    title: 'Turning time into a number',
    body: 'Both sides divide the current Unix time by 30 and throw away the remainder. For 30 seconds at a time they get the same whole number without ever talking to each other.',
    question: "What would go wrong if your phone's clock was five minutes fast?",
  },
  {
    id: 3,
    title: 'Mixing the secret with the time',
    body: 'HMAC-SHA-1 combines the key and the counter into 20 bytes. Change the counter by one and almost every byte changes. Nobody can work backwards from the output to the key.',
    question: 'Which bytes stayed the same when the counter ticked over? Is there a pattern?',
  },
  {
    id: 4,
    title: 'Choosing four bytes',
    body: 'Twenty bytes is too much to type. The last four bits of the digest say where to start reading, and four bytes are taken from there. The top bit is cleared so the number is always positive.',
    question: 'Why let the digest choose its own starting point instead of always using the first four bytes?',
  },
  {
    id: 5,
    title: 'Making it typeable',
    body: 'Keep the last six digits of that number. That is the code.',
    question: 'There are a million possible codes. Why is guessing still impractical?',
  },
];
