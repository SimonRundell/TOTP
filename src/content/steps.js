/**
 * Teaching content for the card beside the clock ring, written for Level 3 learners.
 * One entry per pipeline stage, plus a short overview of the whole process.
 *
 * Each stage has:
 * - purpose: why the stage exists, in one or two sentences.
 * - what: the things that happen, in order.
 * - look: what to look at on screen, as a small task.
 * - terms: words the stage introduces, with plain meanings.
 * - question: a prompt for the class.
 */

/** The big picture, shown at the top of the card at all times. */
export const overview = {
  title: 'The big picture',
  paragraphs: [
    'When you type in a code from an authenticator app, the website has not sent it to your phone. Your phone and the website each work the code out for themselves, at the same moment, using the same recipe. If both get the same answer, you are in.',
    'The recipe has two ingredients. One is a secret that only you and the website know. The other is the time. They are mixed with a scrambling function that only works one way, which gives a code that changes every 30 seconds and is useless to anyone without the secret.',
    'The five panels on the right are the five stages of that recipe, in order. The ring on the left is the clock. Drag it to travel in time and watch every stage change.',
  ],
  recipe: 'code = last 6 digits of ( 4 bytes picked from HMAC-SHA-1( secret, floor( time ÷ 30 ) ) )',
};

export const steps = [
  {
    id: 1,
    title: 'The shared secret',
    purpose:
      'Everything starts with a secret that only your phone and the website know. Without it nobody can make your codes, even if they have seen every code you have ever used.',
    what: [
      'When you set up an account, the website makes a random secret and shows it to you as a QR code.',
      'Your phone scans the QR code and keeps the secret. After that it is never sent again, by either side.',
      'The secret is written in Base32, which uses the letters A to Z and the digits 2 to 7. It is only a readable way to write down raw bytes. The digits 0, 1, 8 and 9 are left out because they look like the letters O, I, B and g.',
      'The app turns the characters back into bytes, which are shown below the box. These bytes are the key that stage 3 uses.',
    ],
    look: 'Change one letter of the secret and watch every later stage change. Press Random for a new secret. Open "How Base32 works" to see each letter become five bits, then regroup into eight-bit bytes.',
    terms: [
      { term: 'Byte', meaning: 'A number from 0 to 255. In hex it is two characters, 00 to FF.' },
      { term: 'Key', meaning: 'The secret, as bytes. It is the part that must never be shared.' },
      { term: 'Base32', meaning: 'A way of writing bytes using 32 easy-to-read characters.' },
    ],
    question: 'Why does the alphabet leave out 0, 1, 8 and 9?',
  },
  {
    id: 2,
    title: 'Turning time into a number',
    purpose:
      'The phone and the website need a number that changes over time, and they must agree on it without talking to each other. The clock gives them one.',
    what: [
      'Start with the Unix time: the number of seconds since midnight on 1 January 1970, UTC. Every computer can read it, whatever time zone it is in.',
      'Subtract T0, the starting point. It is 0 by default, so this changes nothing.',
      'Divide by the period X, which is 30 seconds by default, and throw away the remainder. The answer is the counter, T.',
      'T stays the same for a whole period, then goes up by one. The phone and the website get the same T as long as their clocks agree.',
      'T is stored as eight bytes with the big end first. Most of them are zero, because T is a small number in a very large space.',
    ],
    look: 'Watch the ring. One full turn is one period. When the arc completes, T goes up by one. Drag the ring in both directions and read the sum in this stage as it changes.',
    terms: [
      { term: 'Unix time', meaning: 'Seconds since 1 January 1970, UTC.' },
      { term: 'Counter (T)', meaning: 'How many whole periods have passed since T0.' },
      { term: 'Period (X)', meaning: 'How long each code lasts. 30 seconds is the usual choice.' },
    ],
    question: "What would go wrong if your phone's clock was five minutes fast?",
  },
  {
    id: 3,
    title: 'Mixing the secret with the time',
    purpose:
      'This stage scrambles the secret and the counter together so that the result cannot be worked backwards. It is what makes it safe to show a code to strangers.',
    what: [
      'HMAC-SHA-1 is a standard recipe. It takes two inputs, the key from stage 1 and the counter from stage 2, and gives out exactly 20 bytes. These are called the digest.',
      'It only works one way. Knowing the digest tells you nothing useful about the key.',
      'It is also very sensitive. Change the counter by one and nearly every byte comes out different, so neighbouring codes look completely unrelated.',
      'The same key and the same counter always give the same 20 bytes. That is why the phone and the website agree.',
    ],
    look: 'Press +1 step under the ring. The note under the digest says how many of the 20 bytes changed. Expect nearly all of them. Then go back one step and check that the old bytes return.',
    terms: [
      { term: 'HMAC', meaning: 'A way to mix a secret key with a message so that only someone with the key can repeat it.' },
      { term: 'SHA-1', meaning: 'The scrambling function inside HMAC here. It always gives 20 bytes.' },
      { term: 'Digest', meaning: 'The 20 bytes that come out.' },
    ],
    question: 'Which bytes stayed the same when the counter ticked over? Is there a pattern?',
  },
  {
    id: 4,
    title: 'Choosing four bytes',
    purpose:
      'Twenty bytes is far too long to type. This stage picks four of them in a way that is hard to predict and turns them into one ordinary number.',
    what: [
      'Look at the last byte of the digest, byte 19. Its last four bits make a number from 0 to 15. That is the offset.',
      'Start reading at that offset and take four bytes in a row. They sit inside the amber bracket in stage 3.',
      'Clear the top bit of the first byte. That keeps the number positive on every kind of computer. The bit that is cleared is shown in red.',
      'Join the four bytes into one whole number. It is always below about 2.1 billion.',
    ],
    look: 'Predict the offset from byte 19 before you move the clock, then check the bracket in stage 3. Find a time where the top bit really is cleared, so the red bit shows.',
    terms: [
      { term: 'Offset', meaning: 'Where in the digest to start reading. Always 0 to 15.' },
      { term: 'Nibble', meaning: 'Half a byte, four bits. The offset is the low nibble of byte 19.' },
      { term: 'Mask', meaning: 'Forcing certain bits to 0. Here it clears the top bit.' },
    ],
    question: 'Why let the digest choose its own starting point instead of always using the first four bytes?',
  },
  {
    id: 5,
    title: 'Making it typeable',
    purpose: 'The last job is to make the number short enough to read off a screen and type in. We keep only the last few digits.',
    what: [
      'Take the number from stage 4 and divide it by 1,000,000. Keep the remainder. That is the same as keeping its last six digits. Seven and eight digit codes work the same way with 10 million and 100 million.',
      'If the result starts with zeros, they stay. 081804 is a valid code. Writing it as 81804 would be a mistake.',
      'That is the code on your phone. It stays on screen for the rest of the period, then the next counter gives a new one.',
      'The website runs stages 1 to 5 itself and checks that your answer matches. The verification window at the bottom shows how it allows for clocks that drift a little.',
    ],
    look: 'Compare the code in the centre of the ring with this stage. Then open Settings, scan the QR code with an authenticator app and check that your phone shows the same code.',
    terms: [
      { term: 'mod', meaning: 'The remainder after dividing. 17 mod 5 is 2.' },
      { term: 'Padding', meaning: 'Adding zeros at the front so the code is always the right length.' },
    ],
    question: 'There are a million possible codes. Why is guessing still impractical?',
  },
];
