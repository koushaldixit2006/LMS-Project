import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import connectDb from "./configs/db.js";
import User from "./models/userModel.js";
import Course from "./models/courseModel.js";
import Lecture from "./models/lectureModel.js";
import Review from "./models/reviewModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const sampleVideos = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4"
];

const coursesData = [
  {
    title: "Full-Stack Web Development Bootcamp (MERN)",
    subTitle: "Master MongoDB, Express.js, React, and Node.js from scratch with real projects",
    description: "Learn full-stack web development end-to-end. Cover HTML, CSS, JavaScript ES6+, React, Node.js, Express, and MongoDB. Build real-world portfolio projects including an e-commerce platform and social media app.",
    category: "Web Development",
    level: "Beginner",
    price: 499,
    thumbnail: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Web Architecture & Frontend Fundamentals",
        videoUrl: sampleVideos[0],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. React Components, State & Hooks Deep Dive",
        videoUrl: sampleVideos[1],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Building REST APIs with Express & Node.js",
        videoUrl: sampleVideos[2],
        isPreviewFree: false
      },
      {
        lectureTitle: "4. Database Modeling with MongoDB & Mongoose",
        videoUrl: sampleVideos[3],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "This course completely transformed my coding journey! Built my first full-stack app in just 2 weeks."
      },
      {
        rating: 5,
        comment: "Very clear explanations and great structure. Perfect for anyone starting web development."
      }
    ]
  },
  {
    title: "Complete Python & Machine Learning Masterclass",
    subTitle: "Build real Machine Learning models with Python, Scikit-Learn, and TensorFlow",
    description: "Understand the math and practical implementation of Machine Learning. Covers supervised learning, unsupervised learning, model evaluation, neural networks, and deploying models with FastAPI.",
    category: "AI/ML",
    level: "Intermediate",
    price: 799,
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Python for Data Science & ML Environment Setup",
        videoUrl: sampleVideos[4],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. NumPy & Pandas for Data Preprocessing",
        videoUrl: sampleVideos[5],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Supervised Learning Algorithms with Scikit-Learn",
        videoUrl: sampleVideos[6],
        isPreviewFree: false
      },
      {
        lectureTitle: "4. Introduction to Deep Learning & Neural Networks",
        videoUrl: sampleVideos[7],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "The best ML course on the platform. The real-world datasets and intuitive explanations are unmatched."
      },
      {
        rating: 4,
        comment: "Great content and well paced. Helped me land my first data analyst interview!"
      }
    ]
  },
  {
    title: "Mastering AI Tools & Prompt Engineering",
    subTitle: "Supercharge your productivity using ChatGPT, Claude, Midjourney, and LLM APIs",
    description: "Discover how to effectively write high-impact prompts, leverage generative AI for code, content, and design, and automate repetitive tasks using modern AI workflows.",
    category: "AI Tools",
    level: "Beginner",
    price: 349,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Principles of Prompt Engineering & Large Language Models",
        videoUrl: sampleVideos[8],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. Advanced Prompting Frameworks (Few-shot, Chain-of-Thought)",
        videoUrl: sampleVideos[0],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Integrating AI APIs into Applications",
        videoUrl: sampleVideos[1],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "Saves me 10+ hours a week at work now. Highly recommended for students and professionals!"
      }
    ]
  },
  {
    title: "React Native: Mobile App Development (iOS & Android)",
    subTitle: "Build fast cross-platform iOS and Android mobile apps with React Native & Expo",
    description: "Learn to build cross-platform native applications with React Native. Covers layout with Flexbox, navigation, Redux Toolkit, camera/storage APIs, and building app store binaries.",
    category: "App Development",
    level: "Intermediate",
    price: 599,
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Setting up Expo & React Native Architecture",
        videoUrl: sampleVideos[2],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. Navigation, Tabs & Screen Transitions",
        videoUrl: sampleVideos[3],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Managing Global State with Redux Toolkit",
        videoUrl: sampleVideos[4],
        isPreviewFree: false
      },
      {
        lectureTitle: "4. Building & Deploying to Play Store & App Store",
        videoUrl: sampleVideos[5],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "Excellent course! Created my first iOS and Android app within a month."
      },
      {
        rating: 5,
        comment: "Very clear code walk-throughs and modern Expo Router practices."
      }
    ]
  },
  {
    title: "Complete Ethical Hacking & Cybersecurity Bootcamp",
    subTitle: "Learn network security, penetration testing, Kali Linux, and vulnerability assessment",
    description: "Start your cybersecurity career from scratch. Master Linux basics, network scanning, Wireshark packet analysis, OWASP Top 10 vulnerabilities, and ethical penetration testing methodologies.",
    category: "Ethical Hacking",
    level: "Advanced",
    price: 899,
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Cybersecurity Fundamentals & Kali Linux Lab Setup",
        videoUrl: sampleVideos[6],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. Network Reconnaissance & Port Scanning with Nmap",
        videoUrl: sampleVideos[7],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Web Application Security & OWASP Top 10 Explaining",
        videoUrl: sampleVideos[8],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "Hands-on labs and explanations are super solid. Great guidance on security mindsets."
      }
    ]
  },
  {
    title: "UI/UX Design Masterclass with Figma",
    subTitle: "Design stunning mobile apps and modern web interfaces using Figma and design systems",
    description: "Learn user experience design, wireframing, color psychology, typography, Figma auto-layout, components, variants, and interactive prototyping for client handoffs.",
    category: "UI UX Designing",
    level: "Beginner",
    price: 399,
    thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Principles of Clean UI Design & Color Systems",
        videoUrl: sampleVideos[0],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. Figma Auto-Layout, Components & Variants",
        videoUrl: sampleVideos[1],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Interactive Prototyping & Developer Handoff",
        videoUrl: sampleVideos[2],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "Figma made so simple! I redesigned my portfolio and landed my first UI design gig."
      },
      {
        rating: 4,
        comment: "Very detailed and practical lessons on components and design tokens."
      }
    ]
  },
  {
    title: "Data Science with Python & SQL for Beginners",
    subTitle: "Turn raw data into actionable insights using SQL, Pandas, and interactive dashboards",
    description: "Learn essential data science techniques. Master SQL database queries, statistical analysis, data cleaning with Pandas, and data storytelling.",
    category: "Data Science",
    level: "Intermediate",
    price: 649,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. SQL Queries for Data Extraction & Joining Tables",
        videoUrl: sampleVideos[3],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. Exploratory Data Analysis with Pandas & Seaborn",
        videoUrl: sampleVideos[4],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Statistical Analysis & Hypothesis Testing",
        videoUrl: sampleVideos[5],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "Clear, practical, and highly relevant for anyone looking to enter data analytics."
      }
    ]
  },
  {
    title: "Data Analytics & Business Intelligence with Power BI",
    subTitle: "Master Power BI, DAX formulas, and interactive dashboards for data-driven decisions",
    description: "Comprehensive Power BI course focusing on importing diverse datasets, writing custom DAX measures, building executive KPI dashboards, and sharing reports.",
    category: "Data Analytics",
    level: "Intermediate",
    price: 499,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    lectures: [
      {
        lectureTitle: "1. Getting Started with Power BI Desktop & ETL Transformations",
        videoUrl: sampleVideos[6],
        isPreviewFree: true
      },
      {
        lectureTitle: "2. Essential DAX Functions & Calculated Columns",
        videoUrl: sampleVideos[7],
        isPreviewFree: true
      },
      {
        lectureTitle: "3. Designing Interactive Business Dashboards & Visualizations",
        videoUrl: sampleVideos[8],
        isPreviewFree: false
      }
    ],
    reviews: [
      {
        rating: 5,
        comment: "Awesome course! The dashboard design techniques helped our management team immensely."
      }
    ]
  }
];

const studentSeedUsers = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    role: "student",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    description: "Aspiring Web Developer & Tech Enthusiast"
  },
  {
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "student",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    description: "Data Analyst & Lifelong Learner"
  },
  {
    name: "Amit Patel",
    email: "amit.patel@example.com",
    role: "student",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    description: "Computer Science Student & Mobile Dev Enthusiast"
  },
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    role: "student",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    description: "Product Designer & UI/UX Specialist"
  }
];

async function seedDatabase() {
  try {
    await connectDb();
    console.log("🌱 Starting course & user seeding...");

    // 1. Get or create educator
    let educator = await User.findOne({ role: "educator" });
    if (!educator) {
      const hashedPassword = await bcrypt.hash("educator123", 10);
      educator = await User.create({
        name: "Koushal Dixit",
        email: "koshalramdixit@gmail.com",
        password: hashedPassword,
        role: "educator",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        description: "Senior Full-Stack Developer & Educator with 5+ years of experience in modern web architecture, AI, and cloud technologies."
      });
      console.log(`✅ Created educator: ${educator.name}`);
    } else {
      let needsSave = false;
      if (!educator.photoUrl) {
        educator.photoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
        needsSave = true;
      }
      if (!educator.description) {
        educator.description = "Senior Full-Stack Developer & Educator with 5+ years of experience in modern web architecture, AI, and cloud technologies.";
        needsSave = true;
      }
      if (needsSave) {
        await educator.save();
        console.log(`✅ Updated educator profile: ${educator.name}`);
      }
    }

    // 2. Get or create students
    const studentUsers = [];
    const defaultPassword = await bcrypt.hash("student123", 10);
    for (const studentData of studentSeedUsers) {
      let student = await User.findOne({ email: studentData.email });
      if (!student) {
        student = await User.create({
          ...studentData,
          password: defaultPassword
        });
        console.log(`✅ Created student: ${student.name}`);
      }
      studentUsers.push(student);
    }

    // 3. Create courses with lectures and reviews
    let createdCount = 0;
    for (let i = 0; i < coursesData.length; i++) {
      const c = coursesData[i];
      // Check if course with same title exists
      const existing = await Course.findOne({ title: c.title });
      if (existing) {
        console.log(`ℹ️ Course already exists: ${c.title}`);
        continue;
      }

      // Create lectures
      const lectureIds = [];
      for (const lec of c.lectures) {
        const createdLecture = await Lecture.create({
          lectureTitle: lec.lectureTitle,
          videoUrl: lec.videoUrl,
          isPreviewFree: lec.isPreviewFree
        });
        lectureIds.push(createdLecture._id);
      }

      // Create course
      const newCourse = await Course.create({
        title: c.title,
        subTitle: c.subTitle,
        description: c.description,
        category: c.category,
        level: c.level,
        price: c.price,
        thumbnail: c.thumbnail,
        creator: educator._id,
        lectures: lectureIds,
        isPublished: true,
        enrolledStudents: []
      });

      // Create reviews
      const reviewIds = [];
      if (c.reviews && c.reviews.length > 0) {
        for (let rIndex = 0; rIndex < c.reviews.length; rIndex++) {
          const rev = c.reviews[rIndex];
          const reviewUser = studentUsers[(i + rIndex) % studentUsers.length];
          const createdReview = await Review.create({
            course: newCourse._id,
            user: reviewUser._id,
            rating: rev.rating,
            comment: rev.comment,
            reviewedAt: new Date(Date.now() - (rIndex * 86400000 * 2)) // staggered dates
          });
          reviewIds.push(createdReview._id);
        }
      }

      // Enroll some students
      const enrolledStudentIds = [
        studentUsers[i % studentUsers.length]._id,
        studentUsers[(i + 1) % studentUsers.length]._id
      ];

      newCourse.reviews = reviewIds;
      newCourse.enrolledStudents = enrolledStudentIds;
      await newCourse.save();

      // Also add to enrolled students' enrolledCourses
      for (const sId of enrolledStudentIds) {
        await User.findByIdAndUpdate(sId, {
          $addToSet: { enrolledCourses: newCourse._id }
        });
      }

      console.log(`✅ Created course: "${newCourse.title}" (${newCourse.category}) with ${lectureIds.length} lectures and ${reviewIds.length} reviews`);
      createdCount++;
    }

    console.log(`🎉 Seeding complete! Successfully added ${createdCount} courses.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
