<template>
  <div class="main-container">
    <h1>Random Quote Generator</h1>
    <div style="display: flex; flex-direction: column; align-items: center">
      <div
        style="
          height: 300px;
          word-break: break-word;
          width: 250px;
          display: flex;
          justify-content: center;
          align-items: center;
        "
      >
        <div
          v-if="loading"
          style="
            display: flex;
            justify-content: center;
            height: 100%;
            align-items: center;
          "
        >
          <Icon icon="eos-icons:loading" width="40px" height="40px" />
        </div>
        <div
          v-else-if="!loading"
          style="
            color: grey;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            justify-content: center;
            height: 100%;
            align-items: center;
          "
        >
          <template v-if="message">
            <div
              ref="message"
              style="padding: 10px; position: relative"
            >
              <span ref="text">
                {{ message }}
              </span>
              <div
                style="
                  background-color: grey;
                  padding: 5px;
                  position: absolute;
                  right: -10px;
                  top: -10px;
                  border-radius: 50%;
                  cursor: pointer;
                  position: absolute;
                  text-align: center;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                "
                @click="copyQuote"
              >
                <Icon
                  v-if="!isCopied"
                  icon="basil:copy-outline"
                  width="20px"
                  height="20px"
                  color="white"
                />
                <Icon
                  v-else
                  icon="tabler:copy-check-filled"
                  width="20px"
                  height="20px"
                  color="white"
                />
              </div>
            </div>
          </template>
          <template v-else-if="image">
            <div style="position: relative">
              <img
                v-if="image"
                :src="image"
                alt="No Image Found"
                style="width: 250px; height: 300px"
              />
              <div
                style="
                  background-color: white;
                  padding: 5px;
                  position: absolute;
                  right: 3%;
                  top: 3%;
                  border-radius: 50%;
                  cursor: pointer;
                "
                @click="downloadImage"
              >
                <img
                  src="./assets/download.svg"
                  alt="download"
                  style="width: 20px; height: 20px"
                />
              </div>
            </div>
          </template>
          <template v-else> Please hit buttons to see the magic </template>
        </div>
      </div>
      <div style="margin-top: 40px; display: flex">
        <button @click="generateQuote" class="generate-button">
          Generate Quote
        </button>
        <button @click="generateRandomImage" class="generate-button">
          Generate Quote Image
        </button>
        <div
          style="
            display: flex;
            align-items: center;
            background-color: #B9D0E9;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
          "
          @click="recognizeText"
        >
          <Icon
            v-if="!isSpeaking"
            icon="gravity-ui:volume"
            width="20px"
            height="20px"
            color="cornsilk"
          />
          <Icon
            v-else
            icon="mingcute:stop-circle-fill"
            width="20px"
            height="20px"
            color="cornsilk"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Icon } from "@iconify/vue";
// import Tesseract from "tesseract.js";

export default {
  data() {
    return {
      message: "",
      loading: false,
      image: null,
      counter: 0,
      isCopied: false,
      isSpeaking: false,
      words: [],
      currentIndex: -1,
    };
  },
  components: {
    Icon,
  },
  methods: {
    async generateQuote() {
      try {
        this.loading = true;
        this.image = null;
        fetch("/api/random") // This will be proxied to https://api.quotable.io/random
          .then((response) => response.json())
          .then((data) => {
            this.message = data.content;
            this.loading = false;
          })
          .catch((error) => console.error("Error:", error));
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    },
    async generateRandomImage() {
      try {
        this.loading = true;
        this.message = null;
        if (this.counter < 6) {
          const response = await fetch("/other-api/image");
          const imageBlob = await response.blob();
          const imageURL = URL.createObjectURL(imageBlob);
          this.image = imageURL;

          const storedUrls =
            JSON.parse(localStorage.getItem("storedUrls")) || [];
          storedUrls.push(imageURL);
          localStorage.setItem("storedUrls", JSON.stringify(storedUrls));
          this.counter++;
        } else {
          const storedUrls = JSON.parse(localStorage.getItem("storedUrls"));
          const randomIndex = Math.floor(Math.random() * storedUrls.length);
          this.image = storedUrls[randomIndex];
        }
        this.loading = false;
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    },
    downloadImage() {
      // Create a temporary <a> element
      const link = document.createElement("a");
      link.href = this.image;

      // Set the 'download' attribute to prompt the browser to save the file
      link.download = "quote-image.jpg"; // Set the desired file name

      // Append the <a> to the document and trigger the click
      document.body.appendChild(link);
      link.click();

      // Clean up by removing the <a> element
      document.body.removeChild(link);
    },

    copyQuote() {
      if (!this.isCopied) {
        const storage = document.createElement("textarea");
        storage.value = this.$refs.message.innerText;
        this.$refs.message.appendChild(storage);
        storage.select();
        storage.setSelectionRange(0, 99999);
        document.execCommand("copy");
        this.$refs.message.removeChild(storage);
        this.isCopied = true;
        setTimeout(() => {
          this.isCopied = false;
        }, 5000);
      }
    },
    recognizeText() {
      if (!this.isSpeaking) {
        if (!this.message) {
          alert("Please enter text to speak!");
          return;
        }
        this.words = this.message.split(" ");
        this.currentIndex = -1;

        const utterance = new SpeechSynthesisUtterance(this.message);
        utterance.onend = () => {
          this.isSpeaking = false;
        };

        utterance.rate = 0.5;

        utterance.onboundary = (e) => {
          if (e.name === "word") {
            let charIndex = e.charIndex;
            let cumulativeLength = 0;
            this.currentIndex = this.words.findIndex((word) => {
              const wordStart = cumulativeLength;
              const wordEnd = wordStart + word.length;
              cumulativeLength = wordEnd + 1; // Add 1 for the space
              return charIndex >= wordStart && charIndex < wordEnd;
            });
            this.highlightWord();
          }
        };
        window.speechSynthesis.speak(utterance);
        this.isSpeaking = true;
      } else {
        this.isSpeaking = false;
        window.speechSynthesis.cancel();
      }
    },
    highlightWord() {
      // Clear existing highlights
      this.clearHighlights();

      // Highlight current word
      const textElement = this.$refs.text;
      if (textElement && this.currentIndex >= 0) {
        const words = textElement.innerText.split(" ");
        words[this.currentIndex] = `<span class="highlight">${
          words[this.currentIndex]
        }</span>`;
        textElement.innerHTML = words.join(" ");
      }
    },
    clearHighlights() {
      const textElement = this.$refs.text;
      if (textElement) {
        textElement.innerHTML = this.words.join(" "); // Reset original text
      }
    },
  },
};
</script>
<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #a8dbd9, #ffdcae, #f7a8c2, #97c1f5);
  padding-top: 100px;
  align-items: center;
  margin: 0;
  box-sizing: border-box;
}

.main-container {
  background: papayawhip;
  padding: 28px;
  border-radius: 32px;
}

.generate-button {
  text-align: center;
  margin-right: 10px;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  background: #B9D0E9;
    border: none;
    color: cornsilk;
    font-weight: 700;
    font-size: 15px;
}

.highlight {
  background-color: #B9D0E9;
  padding: 2px;
  font-weight: bold;
}
</style>
