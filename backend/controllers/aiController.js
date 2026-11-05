import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Course from "../models/courseModel.js";
dotenv.config();


export const searchWithAi = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const trimmedInput = input.trim();
    let keyword = null;
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const isDummyKey = !apiKey || apiKey.includes("add your") || apiKey.includes("your_");

    if (!isDummyKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an intelligent assistant for an LMS platform. A user will type any query about what they want to learn. Your task is to understand the intent and return one **most relevant keyword** from the following list of course categories and levels:

- App Development  
- AI/ML  
- AI Tools  
- Data Science  
- Data Analytics  
- Ethical Hacking  
- UI UX Designing  
- Web Development  
- Others  
- Beginner  
- Intermediate  
- Advanced  

Only reply with one single keyword from the list above that best matches the query. Do not explain anything. No extra text.

Query: ${trimmedInput}
`;

        let response = null;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
          });
        } catch (modelErr) {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
          });
        }
        keyword = response?.text?.trim();
      } catch (aiErr) {
        console.warn("⚠️ Gemini AI error, falling back to database regex search:", aiErr.message);
      }
    }

    // Direct search by input text in title, subtitle, description, category, level
    const courses = await Course.find({
      isPublished: true,
      $or: [
        { title: { $regex: trimmedInput, $options: 'i' } },
        { subTitle: { $regex: trimmedInput, $options: 'i' } },
        { description: { $regex: trimmedInput, $options: 'i' } },
        { category: { $regex: trimmedInput, $options: 'i' } },
        { level: { $regex: trimmedInput, $options: 'i' } }
      ]
    });

    if (courses.length > 0 || !keyword) {
      return res.status(200).json(courses);
    } else {
      const keywordCourses = await Course.find({
        isPublished: true,
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { subTitle: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { category: { $regex: keyword, $options: 'i' } },
          { level: { $regex: keyword, $options: 'i' } }
        ]
      });
      return res.status(200).json(keywordCourses);
    }
  } catch (error) {
    console.error("AI Search Error:", error);
    return res.status(500).json({ message: "Search failed: " + (error.message || error) });
  }
};