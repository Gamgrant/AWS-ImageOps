import './App.css';
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const getPresignedUploadURL = async () => {
    try {
      console.log('Environment API URL:', process.env.REACT_APP_API_URL); // Add this to debug

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/generate-presigned-url?contentType=${encodeURIComponent(selectedFile.type)}&filename=${encodeURIComponent(selectedFile.name)}`);
            return response.data.presignedUrl;
    } catch (error) {
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Full URL:', `${process.env.REACT_APP_API_URL}/generate-presigned-url?contentType=${encodeURIComponent(selectedFile.type)}&filename=${encodeURIComponent(selectedFile.name)}`);
      
        throw error;
    }
};


  const uploadFileToS3 = async (file, url) => {
    try {
      console.log('Uploading file to URL:', url);
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
      console.log('File successfully uploaded to S3!');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    try {
      const url = await getPresignedUploadURL();
      await uploadFileToS3(selectedFile, url);
      console.log('File successfully uploaded to S3!');
    } catch (error) {
      console.error('Error handling form submit:', error);
      alert('File upload failed');
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <label>
        Text input:
        <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} />
      </label>
      <label>
        File input:
        <input type="file" onChange={handleFileChange} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}

export default App;
