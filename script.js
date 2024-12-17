const dictionaryApi = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const synonymApi = "https://api.datamuse.com/words?rel_syn=";
const randomWordApi = "https://random-word-api.herokuapp.com/all";

const result = document.getElementById("result");
const snd = document.getElementById("sound");
const searchBtn = document.getElementById("search-btn");
const inputField = document.getElementById("input-word");
const rndmWord = document.getElementById("random-btn");

class DictionaryAPI {
  constructor(dictionaryApi) {
    this.dictionaryApi = dictionaryApi;
  }

  fetchWordData(word) {
    return fetch(`${this.dictionaryApi}${word}`)
      .then((response) => response.json())
      .catch(() => {
        throw new Error("Failed to fetch Word");
      });
  }
}

class DatamuseAPI {
  constructor(datamuseApi) {
    this.datamuseApi = datamuseApi;
  }

  fetchSynonyms(word) {
    return fetch(`${this.datamuseApi}${word}`)
      .then((response) => response.json())
      .catch(() => {
        throw new Error("Failed to fetch Synonym/s");
      });
  }
}

class Word {
  constructor(wordData) {
    this.word = wordData.word;
    this.meaning = wordData.meaning;
    this.phonetic = wordData.phonetic;
    this.partOfSpeech = wordData.partOfSpeech;
    this.example = wordData.example || "";
  }

  displayWordDetails(resultElement) {
    resultElement.innerHTML = `
      <div class="word d-flex justify-content-between">
        <h3>${this.word}</h3>
        <button onclick="playSound()">
          <i class="bi bi-volume-up-fill"></i>
        </button>
      </div>
      <div class="word-details d-flex position-relative gap-3 mt-1 mb-4">
        <p>${this.partOfSpeech}</p>
        <p>/${this.phonetic}/</p>
      </div>
      <p class="word-definition">${this.meaning}</p>
      <p class="word-example fst-italic ps-2 mt-3">${this.example}</p>
    `;
  }
}

class AddingToWord extends Word {
  constructor(wordData, synonyms) {
    super(wordData);
    this.synonyms = synonyms || [];
  }

  displaySynonyms(resultElement) {
    if (this.synonyms.length > 0) {
      resultElement.innerHTML += `
        <div class="synonyms mt-4">
          <h4>Synonyms:</h4>
          <p>${this.synonyms.join(", ")}</p>
        </div>
      `;
    } else {
      result.innerHTML += `<div class="synonyms mt-4"><p>No synonyms found for this Word.</p></div>`;
    }
  }
}

inputField.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    output();
  }
});

searchBtn.addEventListener("click", () => {
  output();
});

rndmWord.addEventListener("click", () => {
  generateRandomWord();
});

function generateRandomWord() {
  fetch(randomWordApi)
    .then((response) => response.json())
    .then((data) => {
      const randomWord = data[Math.floor(Math.random() * data.length)];
      inputField.value = randomWord;
      output();
    })
    .catch((error) => {
      console.error("Failed to Fetch Random Word:", error);
      result.innerHTML = `<h3 class="error">Failed to Fetch Random Word</h3>`;
    });
}

function output() {
  let inputWord = inputField.value.trim();

  if (!inputWord) {
    result.innerHTML = `<h3 class="error text-center">PLEASE ENTER A WORD TO USE THE APP</h3>`;
    return;
  }

  const firstApi = new DictionaryAPI(dictionaryApi);
  const secondApi = new DatamuseAPI(synonymApi);

  firstApi.fetchWordData(inputWord)
    .then((data) => {
      if (!data || !data[0].meanings || data[0].meanings.length === 0) {
        throw new Error("Word not found in Dictionary");
      }

      const wordData = {
        word: inputWord,
        meaning:
          data[0].meanings[0]?.definitions[0]?.definition || "Definition not available",
        phonetic: data[0]?.phonetic || "Not available",
        partOfSpeech: data[0].meanings[0]?.partOfSpeech || "Not available",
        example:
          data[0].meanings[0]?.definitions[0]?.example || "No example available",
      };

      const word = new Word(wordData);
      word.displayWordDetails(result);

      if (data[0].phonetics && data[0].phonetics[0]?.audio) {
        snd.setAttribute("src", `https:${data[0].phonetics[0].audio}`);
      } else {
        console.error("Audio not Available for this Word.");
      }

      secondApi.fetchSynonyms(inputWord)
        .then((synonymsData) => {
          let synonyms = synonymsData.slice(0, 5).map((item) => item.word);
          const advancedWord = new AddingToWord(wordData, synonyms);
          advancedWord.displaySynonyms(result);
        })
        .catch(() => {
          result.innerHTML += `<h4>This word either has no synonyms or it failed to fetch some synonyms</h4>`;
        });
    })
    .catch((error) => {
      console.error("Error fetching word data:", error);
      result.innerHTML = `<h3 class="error text-center">Could Not Find the Word: "${inputWord}"</h3>`;
    });
}

function playSound() {
  try {
    if (snd.src && snd.src !== "") {
      snd.play();
    } else {
      console.error("Audio Not Found");
    }
  } catch (error) {
    console.error("Error Audio", error);
  }
}
