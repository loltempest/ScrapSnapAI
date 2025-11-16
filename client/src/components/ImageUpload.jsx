import { useState, useRef, useEffect } from 'react';
import { uploadWasteImage } from '../services/api';

function ImageUpload({ onSuccess }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError(null);
      } else {
        setError('Please drop an image file (JPG, PNG)');
      }
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setError(null);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions or use file upload.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError(null);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;

    setUploading(true);
    setError(null);

    try {
      const data = await uploadWasteImage(image);
      setResult(data);
      setImage(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      let errorMessage = 'Failed to analyze image';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Format error messages to be more user-friendly
      if (errorMessage.includes('quota')) {
        errorMessage = '⚠️ Gemini API quota exceeded. Please check your Google Cloud billing and add credits to continue using the AI analysis feature.';
      } else if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
        errorMessage = '⚠️ Gemini API key error. Please check your .env file and ensure GEMINI_API_KEY is set correctly.';
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
      } else if (errorMessage.includes('GEMINI_API_KEY is not set')) {
        errorMessage = '⚠️ Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.';
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Upload Food Waste Photo
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-green-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                    setResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">{isDragging ? '⬇️' : '📷'}</div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragging ? 'Drop image here' : 'Drag & drop, take a photo, or upload an image'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supported formats: JPG, PNG (max 10MB)
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <label className="cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      📁 Choose File
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📸 Use Camera
                  </button>
                  <label className="cursor-pointer md:hidden">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      📱 Mobile Camera
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {showCamera && (
            <div className="bg-gray-900 rounded-lg p-4 space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  📸 Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  ✖️ Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="font-semibold mb-1">Error</div>
              <div className="text-sm whitespace-pre-line">{error}</div>
              {error.includes('quota') && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <a 
                    href="https://console.cloud.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm underline hover:text-red-800"
                  >
                    Open Google Cloud Console →
                  </a>
                </div>
              )}
              {(error.includes('API key') || error.includes('API_KEY') || error.includes('not set')) && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm underline hover:text-red-800"
                  >
                    Get Gemini API Key →
                  </a>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-green-900">✅ Analysis Complete!</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Items Identified:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {result.analysis.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} ({item.category}) - 
                        {item.estimatedAmount && ` ${item.estimatedAmount}`}
                        {item.estimatedValue && ` - $${item.estimatedValue.toFixed(2)}`}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Total Estimated Value:</strong> ${result.analysis.totalEstimatedValue.toFixed(2)}
                </div>
                {result.analysis.estimatedWaste?.weight && (
                  <div>
                    <strong>Estimated Weight:</strong> {result.analysis.estimatedWaste.weight}
                  </div>
                )}
                {result.analysis.notes && (
                  <div>
                    <strong>Notes:</strong> {result.analysis.notes}
                  </div>
                )}
                {typeof result.analysis.confidence === 'number' && (
                  <div>
                    <strong>Confidence:</strong> {(result.analysis.confidence * 100).toFixed(0)}%
                  </div>
                )}
                {result.analysis.uncertaintyDisclaimer && (
                  <div className="text-yellow-800">
                    <strong>Disclaimer:</strong> {result.analysis.uncertaintyDisclaimer}
                  </div>
                )}
                {result.analysis.needsBetterPhoto && (
                  <div className="text-yellow-700">
                    📷 Please upload a clearer photo (reduce glare, avoid reflections, focus subject).
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!image || uploading}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '🔄 Analyzing...' : '🚀 Analyze Waste'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ImageUpload;






