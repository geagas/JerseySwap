import React, { useState, useCallback, useEffect } from 'react';
import { AppStep } from './types';
import { swapJersey, replaceBackground } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { RestartIcon } from './components/icons/RestartIcon';
import { EditBackgroundIcon } from './components/icons/EditBackgroundIcon';

const processingMessages = [
  'Analyzing player pose...',
  'Detecting original jersey...',
  'Mapping new jersey texture...',
  'Applying realistic folds and shadows...',
  'Blending colors seamlessly...',
  'Preserving background details...',
  'Finalizing the swap...',
  'Analyzing new background...',
  'Matching lighting and perspective...',
  'Casting realistic shadows...',
  'Compositing final image...'
];

const negativePromptOptions = [
  'rectangular patch',
  'pasted image',
  'incorrect logos',
  'blurry',
  'unrealistic lighting',
  'flat texture',
  'wrong colors',
  'cartoonish',
];

type JerseyType = 'Custom Design' | 'Official Jersey';

const App: React.FC = () => {
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [jerseyImage, setJerseyImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [swappedImage, setSwappedImage] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [isEditingBackground, setIsEditingBackground] = useState<boolean>(false);
  const [jerseyType, setJerseyType] = useState<JerseyType>('Custom Design');
  const [selectedNegativePrompts, setSelectedNegativePrompts] = useState<string[]>([
    'rectangular patch',
    'pasted image',
    'incorrect logos',
  ]);

  useEffect(() => {
    if (step === AppStep.PROCESSING) {
      setProcessingMessage(processingMessages[0]);
      let i = 1;
      const interval = setInterval(() => {
        setProcessingMessage(processingMessages[i % processingMessages.length]);
        i++;
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleReset = () => {
    setPlayerImage(null);
    setJerseyImage(null);
    setBackgroundImage(null);
    setSwappedImage(null);
    setError(null);
    setStep(AppStep.UPLOAD);
    setIsEditingBackground(false);
  };

  const handleNegativePromptToggle = (prompt: string) => {
    setSelectedNegativePrompts(prev =>
      prev.includes(prompt)
        ? prev.filter(p => p !== prompt)
        : [...prev, prompt]
    );
  };

  const handleSwap = useCallback(async () => {
    if (!playerImage || !jerseyImage) {
      setError('Please upload both a player photo and a jersey image.');
      return;
    }
    setStep(AppStep.PROCESSING);
    setError(null);
    try {
      const negativePromptString = selectedNegativePrompts.join(', ');
      const resultImage = await swapJersey(playerImage, jerseyImage, negativePromptString, jerseyType);
      setSwappedImage(resultImage);
      setStep(AppStep.PREVIEW);
    } catch (err) {
      console.error(err);
      setError('An error occurred during the AI processing. Please try again.');
      setStep(AppStep.ERROR);
    }
  }, [playerImage, jerseyImage, selectedNegativePrompts, jerseyType]);

  const handleBackgroundSwap = useCallback(async () => {
    if (!swappedImage || !backgroundImage) {
      setError('An error occurred. Missing images for background swap.');
      setStep(AppStep.ERROR);
      return;
    }
    setStep(AppStep.PROCESSING);
    setError(null);
    try {
      const resultImage = await replaceBackground(swappedImage, backgroundImage);
      setSwappedImage(resultImage);
      setStep(AppStep.PREVIEW);
      setIsEditingBackground(false);
      setBackgroundImage(null);
    } catch (err) {
      console.error(err);
      setError('An error occurred during the background replacement. Please try again.');
      setStep(AppStep.ERROR);
    }
  }, [swappedImage, backgroundImage]);

  const handleDownload = () => {
    if (!swappedImage) return;
    const link = document.createElement('a');
    link.href = swappedImage;
    link.download = 'jersey-swap-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (step) {
      case AppStep.UPLOAD:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <ImageUploader
                id="player-image"
                label="Upload Player Photo"
                onImageUpload={setPlayerImage}
                imagePreview={playerImage}
              />
              <ImageUploader
                id="jersey-image"
                label="Upload New Jersey"
                onImageUpload={setJerseyImage}
                imagePreview={jerseyImage}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-8">
              <div>
                <label htmlFor="jersey-type" className="block mb-3 text-sm font-medium text-gray-300">Jersey Type</label>
                <select
                  id="jersey-type"
                  value={jerseyType}
                  onChange={(e) => setJerseyType(e.target.value as JerseyType)}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                >
                  <option>Custom Design</option>
                  <option>Official Jersey</option>
                </select>
              </div>
              <div>
                <label className="block mb-3 text-sm font-medium text-gray-300">
                  Negative Prompts <span className="text-gray-400">(Click to select)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {negativePromptOptions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleNegativePromptToggle(prompt)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 capitalize ${
                        selectedNegativePrompts.includes(prompt)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      aria-pressed={selectedNegativePrompts.includes(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            <div className="w-full mt-8 flex justify-center">
              <button
                onClick={handleSwap}
                disabled={!playerImage || !jerseyImage}
                className="w-full md:w-1/2 bg-indigo-600 text-white font-bold py-4 px-6 rounded-lg text-xl hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed transform hover:scale-105"
              >
                Swap Jersey
              </button>
            </div>
          </>
        );
      case AppStep.PROCESSING:
        return (
          <div className="flex flex-col items-center justify-center text-white h-64">
            <Spinner />
            <p className="text-xl mt-6 font-semibold animate-pulse">{processingMessage}</p>
            <p className="text-gray-400 mt-2">This may take a moment...</p>
          </div>
        );
      case AppStep.PREVIEW:
        return (
          <div className="w-full flex flex-col items-center">
            {swappedImage && (
              <img src={swappedImage} alt="Swapped Jersey" className="max-w-full md:max-w-2xl rounded-lg shadow-2xl" />
            )}
            <div className="flex flex-col md:flex-row gap-4 mt-8 w-full justify-center">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              >
                <DownloadIcon />
                Download
              </button>

              {!isEditingBackground && (
                 <button
                  onClick={() => setIsEditingBackground(true)}
                  className="flex items-center justify-center gap-2 w-full md:w-auto bg-purple-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  <EditBackgroundIcon />
                  Edit Background
                </button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 w-full md:w-auto bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-700 transition-all duration-300"
              >
                <RestartIcon />
                Start Over
              </button>
            </div>

            {isEditingBackground && (
              <div className="w-full max-w-2xl mt-8 p-6 bg-gray-900 rounded-lg border border-gray-700 flex flex-col items-center transition-opacity duration-500 ease-in-out opacity-100">
                <h3 className="text-2xl font-bold text-indigo-400 mb-4">Upload a New Background</h3>
                <ImageUploader
                  id="background-image"
                  label="Upload Background"
                  onImageUpload={setBackgroundImage}
                  imagePreview={backgroundImage}
                />
                <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full">
                  <button
                    onClick={handleBackgroundSwap}
                    disabled={!backgroundImage}
                    className="flex-1 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    Replace Background
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingBackground(false);
                      setBackgroundImage(null);
                    }}
                    className="flex-1 bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case AppStep.ERROR:
        return (
          <div className="w-full flex flex-col items-center bg-red-900/50 border border-red-700 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h3>
            <p className="text-white text-center mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-indigo-700 transition-all duration-300"
            >
              <RestartIcon />
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <Header />
        <main className="mt-8 p-6 md:p-10 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;