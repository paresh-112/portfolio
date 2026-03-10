# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for FAISS and other libraries)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Copy the resume from the parent directory (it's needed for context)
# Note: In a production environment, you might want a more central location
COPY Paresh_Prajapati_Resume_edited_1-1.pdf ./Paresh_Prajapati_Resume_edited_1-1.pdf
COPY index.html ./index.html

# Expose the port the app runs on
EXPOSE 8000

# Set environment variables (Optionally, use a .env file locally)
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
