import { useState, useRef, useCallback, useEffect } from 'react'
import { OPENAI_API_KEY } from './config'

function App() {
  const [isListening, setIsListening] = useState(false)
  const [word, setWord] = useState('')
  const [definition, setDefinition] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [wordList, setWordList] = useState([])
  const [showWordList, setShowWordList] = useState(false)
  const recognitionRef = useRef(null)

  // Load word list from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('satVocabWordList')
    if (saved) {
      setWordList(JSON.parse(saved))
    }
  }, [])

  // Save word list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('satVocabWordList', JSON.stringify(wordList))
  }, [wordList])

  // Add word to the list
  const addWordToList = useCallback((wordEntry, defEntry) => {
    setWordList(prev => {
      // Extract the correct English word from the definition (format: "Word: definition")
      const colonIndex = defEntry.indexOf(':')
      const englishWord = colonIndex !== -1 ? defEntry.substring(0, colonIndex).trim() : wordEntry
      
      // Check if word already exists (case insensitive)
      const exists = prev.some(item => item.englishWord.toLowerCase() === englishWord.toLowerCase())
      if (exists) return prev
      
      return [{
        id: Date.now(),
        spokenWord: wordEntry,
        englishWord: englishWord,
        definition: defEntry,
        addedAt: new Date().toISOString()
      }, ...prev]
    })
  }, [])

  // Delete word from the list
  const deleteWord = useCallback((id) => {
    setWordList(prev => prev.filter(item => item.id !== id))
  }, [])

  // Text-to-speech function - speaks English word in English, Turkish definition in Turkish
  const speakDefinition = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Cancel any ongoing speech
      
      // Split the text into English word and Turkish definition
      const colonIndex = text.indexOf(':')
      if (colonIndex !== -1) {
        const englishWord = text.substring(0, colonIndex).trim()
        const turkishDefinition = text.substring(colonIndex + 1).trim()
        
        // Speak English word in English
        const englishUtterance = new SpeechSynthesisUtterance(englishWord)
        englishUtterance.lang = 'en-US'
        englishUtterance.rate = 0.9
        englishUtterance.pitch = 1
        englishUtterance.onstart = () => setIsSpeaking(true)
        
        // Speak Turkish definition in Turkish after English word
        const turkishUtterance = new SpeechSynthesisUtterance(turkishDefinition)
        turkishUtterance.lang = 'tr-TR'
        turkishUtterance.rate = 0.9
        turkishUtterance.pitch = 1
        turkishUtterance.onend = () => setIsSpeaking(false)
        turkishUtterance.onerror = () => setIsSpeaking(false)
        
        window.speechSynthesis.speak(englishUtterance)
        window.speechSynthesis.speak(turkishUtterance)
      } else {
        // Fallback: speak everything in Turkish if no colon found
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'tr-TR'
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [])

  // Fetch definition from OpenAI
  const fetchDefinition = useCallback(async (spokenWord) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a concise dictionary helping a Turkish student learn English SAT vocabulary. The student is trying to pronounce English words correctly. Even if the pronunciation is not perfect, figure out what English word they mean. Provide a brief, clear definition in TURKISH suitable for a high school student. Keep it under 2 sentences. Format: "[Correct English Word]: [Turkish definition]"'
            },
            {
              role: 'user',
              content: spokenWord
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get definition')
      }

      const data = await response.json()
      const definitionText = data.choices[0].message.content
      setDefinition(definitionText)
      speakDefinition(definitionText)
      addWordToList(spokenWord, definitionText)
    } catch (err) {
      setError('Failed to get definition. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [speakDefinition, addWordToList])

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-US' // English recognition - student will try to pronounce words in English

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setWord('')
      setDefinition('')
      setError('')
    }

    recognitionRef.current.onresult = (event) => {
      const spokenWord = event.results[0][0].transcript.trim().toLowerCase()
      setWord(spokenWord)
      fetchDefinition(spokenWord)
    }

    recognitionRef.current.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again!')
      } else {
        setError(`Error: ${event.error}`)
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }, [fetchDefinition])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  // Repeat the definition
  const repeatDefinition = () => {
    if (definition) {
      speakDefinition(definition)
    }
  }

  return (
    <div className="app">
      <div className="background-pattern"></div>
      
      <header>
        <h1>SAT Vocab Helper</h1>
        <p className="subtitle">Tap, speak, learn</p>
      </header>

      <main>
          <button 
            className={`mic-button ${isListening ? 'listening' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
          >
            <div className="mic-icon">
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </div>
            <span className="mic-label">
              {isLoading ? 'Looking up...' : isListening ? 'Listening...' : 'Tap to speak'}
            </span>
          </button>

          {isListening && (
            <div className="listening-indicator">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          )}

          {word && (
            <div className="word-display">
              <span className="label">Word</span>
              <span className="word">{word}</span>
            </div>
          )}

          {definition && (
            <div className="definition-card">
              <p className="definition-text">{definition}</p>
              <button 
                className={`repeat-btn ${isSpeaking ? 'speaking' : ''}`}
                onClick={repeatDefinition}
                disabled={isSpeaking}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                {isSpeaking ? 'Speaking...' : 'Repeat'}
              </button>
            </div>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {/* Word List Toggle Button */}
          <button 
            className="word-list-toggle"
            onClick={() => setShowWordList(!showWordList)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            My Words ({wordList.length})
          </button>

          {/* Word List Panel */}
          {showWordList && (
            <div className="word-list-panel">
              <div className="word-list-header">
                <h2>My Word List</h2>
                <span className="word-count">{wordList.length} words</span>
              </div>
              
              {wordList.length === 0 ? (
                <div className="empty-list">
                  <p>No words yet!</p>
                  <span>Words you look up will appear here.</span>
                </div>
              ) : (
                <ul className="word-list">
                  {wordList.map((item) => (
                    <li key={item.id} className="word-item">
                      <div className="word-item-content">
                        <span className="word-item-word">{item.englishWord}</span>
                        <p className="word-item-def">{item.definition}</p>
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteWord(item.id)}
                        title="Remove word"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

        </main>

      <footer>
        <p>Made for SAT success 📚</p>
      </footer>
    </div>
  )
}

export default App


