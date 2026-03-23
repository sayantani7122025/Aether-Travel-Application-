import { GoogleGenAI, Type } from "@google/genai";
import { DayPlan, PackingItem, Trip } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateItinerary = async (
  destination: string,
  startDate: string,
  duration: number,
  vibe: string,
  budget: string,
  currency: string,
  origin?: string
): Promise<{ 
  itinerary: DayPlan[]; 
  packingList: PackingItem[]; 
  tips: string[]; 
  essentials: string[]; 
  weather: any;
  transportation: any;
  hotels: any[];
}> => {
  const prompt = `
    Generate a detailed ${duration}-day travel itinerary for ${destination} starting on ${startDate}.
    ${origin ? `The traveler is starting from: ${origin}. Please suggest flights and trains specifically from ${origin} to ${destination}.` : ''}
    Vibe: ${vibe}. Budget Tier: ${budget} (Economic, Standard, or Luxury). 
    Currency for estimated costs: ${currency}.
    
    Include:
    1. A day-wise itinerary with 3-4 activities per day (time, title, description, location, type, estimated cost).
    2. A specific packing list for this destination and expected weather in ${startDate}.
    3. 5-7 highly specific travel tips for ${destination} (not generic).
    4. 5-7 essential items to carry specifically for ${destination}.
    5. Expected weather/climate info for ${destination} during ${startDate}.
    6. Transportation details:
       - Nearby airports (name, code, distance from city center).
       - Nearby train stations (name, distance from city center).
       - General advice on how to reach the destination.
       - 2-3 flight options with estimated prices and a Google Search URL for booking.
       - 2-3 train options (if applicable) with estimated prices and a Google Search URL for booking.
    7. 3-4 Hotel recommendations matching the ${budget} budget:
       - Name, estimated price per night, rating, brief description, and a Google Search URL for booking.
    
    Return the data in strict JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itinerary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                date: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      time: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      location: { type: Type.STRING },
                      type: { type: Type.STRING },
                      cost: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          },
          packingList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                item: { type: Type.STRING },
                category: { type: Type.STRING },
                checked: { type: Type.BOOLEAN }
              }
            }
          },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          essentials: { type: Type.ARRAY, items: { type: Type.STRING } },
          weather: {
            type: Type.OBJECT,
            properties: {
              temp: { type: Type.STRING },
              condition: { type: Type.STRING },
              icon: { type: Type.STRING }
            }
          },
          transportation: {
            type: Type.OBJECT,
            properties: {
              airports: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    code: { type: Type.STRING },
                    distance: { type: Type.STRING }
                  }
                }
              },
              trainStations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    distance: { type: Type.STRING }
                  }
                }
              },
              howToReach: { type: Type.STRING },
              flights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    airline: { type: Type.STRING },
                    estimatedPrice: { type: Type.NUMBER },
                    googleSearchUrl: { type: Type.STRING }
                  }
                }
              },
              trains: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    estimatedPrice: { type: Type.NUMBER },
                    googleSearchUrl: { type: Type.STRING }
                  }
                }
              }
            }
          },
          hotels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                estimatedPricePerNight: { type: Type.NUMBER },
                rating: { type: Type.STRING },
                description: { type: Type.STRING },
                googleSearchUrl: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const getSearchSuggestions = async (query: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  
  const prompt = `Suggest 5 travel destinations based on the search query: "${query}". 
  Include the destination name, country, and a very brief description. 
  Also, if the query has a spelling error, suggest the correct spelling.
  Return as JSON array of objects { name, country, description, correctedSpelling? }.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            country: { type: Type.STRING },
            description: { type: Type.STRING },
            correctedSpelling: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const getDestinationImages = async (destination: string): Promise<string[]> => {
  const prompt = `Provide 6 high-quality image URLs from Unsplash or similar public sources for the travel destination: "${destination}". 
  The URLs should be direct image links. 
  Return as a JSON array of strings.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text);
};
