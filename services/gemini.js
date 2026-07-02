const https = require('https');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("Gemini Key:", GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Call the Gemini API using Node's native HTTPS module for maximum environment compatibility.
 * @param {string} prompt - User instruction
 * @param {string} systemInstruction - System contextual instruction
 * @param {boolean} jsonMode - Request output formatted as JSON
 * @returns {Promise<string>} - The generated content
 */
const callGemini = (prompt, systemInstruction = '', jsonMode = false) => {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder' || GEMINI_API_KEY.startsWith('AIzaSy_placeholder')) {
      console.warn('GEMINI_API_KEY is not set. Using mock AI response mode.');
      return resolve(getMockResponse(prompt, systemInstruction));
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (jsonMode) {
      requestBody.generationConfig = {
        responseMimeType: 'application/json'
      };
    }

    const dataString = JSON.stringify(requestBody);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length
      },
      timeout: 15000 // 15s timeout
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            console.error("Gemini API Error Response:", parsed);

            const message = parsed.error?.message || "";

            if (
              res.statusCode === 429 ||
              res.statusCode === 503 ||
              parsed.error?.status === "RESOURCE_EXHAUSTED" ||
              message.toLowerCase().includes("quota exceeded") ||
              message.toLowerCase().includes("high demand")
            ) {
              console.log("Gemini unavailable. Returning mock response.");

              return resolve(getMockResponse(prompt, systemInstruction));
            }

            return reject(new Error(message || `API request failed with status ${res.statusCode}`));
          }
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            return reject(new Error('Invalid response structure from Gemini API'));
          }
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse Gemini response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API request timed out'));
    });

    req.write(dataString);
    req.end();
  });
};

/**
 * Fallback Mock response generator for local testing when no Gemini API Key is provided.
 */
function getMockResponse(prompt, systemInstruction) {
  const lowercase = prompt.toLowerCase();

  if (systemInstruction.includes('quiz') || lowercase.includes('quiz') || lowercase.includes('mcq')) {
    return JSON.stringify([
      {
        question_text: "What is the time complexity of a Binary Search on a sorted array of size n?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correct_option_index: 1,
        explanation: "Binary Search repeatedly divides the search interval in half, leading to a logarithmic runtime complexity."
      },
      {
        question_text: "Which of the following data structures operates on a Last-In, First-Out (LIFO) basis?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        correct_option_index: 1,
        explanation: "A Stack pushes elements on top and pops them from the top, making the last added element the first to be retrieved."
      }
    ]);
  }

  if (systemInstruction.includes('flashcard') || lowercase.includes('flashcard') || lowercase.includes('deck')) {
    return JSON.stringify([
      {
        front: "What is the primary memory of a computer?",
        back: "RAM (Random Access Memory), which stores data that the CPU needs active access to."
      },
      {
        front: "What is encapsulation in OOP?",
        back: "The bundling of data with the methods that operate on that data, restricting direct access to some of the object's components."
      }
    ]);
  }

  if (systemInstruction.includes('roadmap') || lowercase.includes('roadmap')) {
    return JSON.stringify({
      title: "Backend Development Roadmap",
      description: "Learn how to build scalable APIs and database architectures.",
      steps: [
        { phase: "Phase 1: Foundations", topics: ["HTTP Protocol", "REST API design", "JavaScript / Node.js basics"] },
        { phase: "Phase 2: Express.js & Middleware", topics: ["Routing", "Authentication", "Validation & Error Handling"] },
        { phase: "Phase 3: Database Integration", topics: ["PostgreSQL schema design", "Supabase Client", "SQL indexes & performance"] }
      ]
    });
  }

  if (systemInstruction.includes('planner') || lowercase.includes('study planner')) {
    return JSON.stringify([
      { title: "Review algorithms notes", description: "Read through dynamic programming notes.", duration_minutes: 45, priority: "high" },
      { title: "Solve practice quiz", description: "Take the data structures MCQ quiz.", duration_minutes: 20, priority: "medium" },
      { title: "Leitner card review", description: "Quick flashcard spacing review session.", duration_minutes: 15, priority: "low" }
    ]);
  }

  // Generic content generators
  if (lowercase.includes('summarize') || lowercase.includes('summary')) {
    return `### Executive Summary\nThe provided content discusses the fundamental aspects of the target subject. Here are the key highlights:\n- **Core Theme**: High-level understanding of variables and functions.\n- **Crucial Insights**: Implementation of scalable routines improves execution times.\n- **Key Takeaway**: Optimize early by choosing proper data structures.`;
  }

  if (lowercase.includes('explain') || lowercase.includes('concept')) {
    return `### Concept Explanation\nHere is a simple breakdown of the topic:\n\n1. **What is it?** A conceptual foundation in computing.\n2. **Analogy**: Think of it as a blueprint for a building. The blueprint itself is the class, and the actual building is the object.\n3. **Why it matters**: It allows developers to create reusable, clean modules.`;
  }

  return `### AI Assistance Response\nHere is the generated explanation for your query:\n\n1. **Core Details**: The concept operates under standard mathematical rules.\n2. **Practical Example**: For an input of size 100, a linear routine requires 100 operations.\n3. **Additional Guidance**: Use memory caching strategies to lower latency.`;
}

module.exports = {
  callGemini
};
