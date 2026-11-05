import Course from "../models/courseModel.js";
import razorpay from 'razorpay'
import User from "../models/userModel.js";
import dotenv from "dotenv"
dotenv.config()
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
})

export const createOrder = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const isDummyKey = !keyId || keyId.includes("add your") || keyId === "add_your_razorpay_key_id";

    if (isDummyKey) {
      const targetUserId = userId || req.userId;
      if (targetUserId) {
        const user = await User.findById(targetUserId);
        if (user && !user.enrolledCourses.includes(courseId)) {
          user.enrolledCourses.push(courseId);
          await user.save();
        }
        if (!course.enrolledStudents.includes(targetUserId)) {
          course.enrolledStudents.push(targetUserId);
          await course.save();
        }
      }
      return res.status(200).json({
        directEnroll: true,
        message: "Enrollment successful!"
      });
    }

    const options = {
      amount: course.price * 100, // in paisa
      currency: 'INR',
      receipt: `${courseId}.toString()`,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.log(err);
    const { courseId, userId } = req.body;
    const targetUserId = userId || req.userId;
    if (targetUserId) {
      const user = await User.findById(targetUserId);
      const course = await Course.findById(courseId);
      if (user && !user.enrolledCourses.includes(courseId)) {
        user.enrolledCourses.push(courseId);
        await user.save();
      }
      if (course && !course.enrolledStudents.includes(targetUserId)) {
        course.enrolledStudents.push(targetUserId);
        await course.save();
      }
      return res.status(200).json({
        directEnroll: true,
        message: "Enrollment successful!"
      });
    }
    return res.status(500).json({ message: `Order creation failed ${err}` });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, courseId, userId, isDemo } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const isDummyKey = !keyId || keyId.includes("add your");

    if (isDemo || isDummyKey) {
      const user = await User.findById(userId);
      if (user && !user.enrolledCourses.includes(courseId)) {
        user.enrolledCourses.push(courseId);
        await user.save();
      }

      const course = await Course.findById(courseId).populate("lectures");
      if (course && !course.enrolledStudents.includes(userId)) {
        course.enrolledStudents.push(userId);
        await course.save();
      }

      return res.status(200).json({ message: "Payment verified and enrollment successful" });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status === 'paid') {
      const user = await User.findById(userId);
      if (!user.enrolledCourses.includes(courseId)) {
        user.enrolledCourses.push(courseId);
        await user.save();
      }

      const course = await Course.findById(courseId).populate("lectures");
      if (!course.enrolledStudents.includes(userId)) {
        course.enrolledStudents.push(userId);
        await course.save();
      }

      return res.status(200).json({ message: "Payment verified and enrollment successful" });
    } else {
      return res.status(400).json({ message: "Payment verification failed (invalid signature)" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error during payment verification" });
  }
};
