import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleGenAI } from '@google/genai';
import { CommonModule } from '@angular/common'; // Required for @if and other common directives

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // FormsModule is needed for [(ngModel)]
  templateUrl: './app.component.html',
  styleUrls: [], // Using Tailwind for styling, so no component-specific styles needed
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush for performance with signals
  host: {
    // Apply Tailwind classes directly to the host element
    class: 'block w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 sm:p-8 space-y-6',
  }
})
export class AppComponent {
  // Signals for managing component state
  prompt = signal<string>('A young man wearing a white tracksuit, standing outdoors in a lush forest.');
  generatedImageUrl = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // GoogleGenAI client instance
  private ai: GoogleGenAI;

  constructor() {
    // CRITICAL: Initialize GoogleGenAI client with API key from environment variable
    if (!process.env.API_KEY) {
      this.error.set("API_KEY is not defined in the environment variables. Please configure it.");
      // Optionally, disable functionality if API key is missing
      return;
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Triggers the image generation process using the GenAI model.
   */
  async generateImage(): Promise<void> {
    if (!this.prompt() || this.isLoading()) {
      return; // Prevent generation if prompt is empty or already loading
    }

    this.isLoading.set(true); // Set loading state
    this.error.set(null); // Clear previous errors
    this.generatedImageUrl.set(null); // Clear previous image

    try {
      // Call the GenAI model for image generation
      const response = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-002', // Adhering to the specified image generation model
        prompt: this.prompt(),
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg', // Request JPEG output
          aspectRatio: '1:1', // Square aspect ratio for simplicity
        },
      });

      // Process the response and update the image URL
      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        this.generatedImageUrl.set(`data:image/jpeg;base64,${base64ImageBytes}`);
      } else {
        this.error.set('No image was generated. Please try a different prompt or model.');
      }
    } catch (e: any) {
      console.error('Error generating image:', e);
      this.error.set(`Failed to generate image: ${e.message || 'An unknown error occurred.'}`);
    } finally {
      this.isLoading.set(false); // Reset loading state
    }
  }
}