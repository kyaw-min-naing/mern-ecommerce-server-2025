import { User } from "../models/user.js";
import { ControllerType, NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility.class.js";

export const newUser: ControllerType<NewUserRequestBody> = TryCatch(
  async (req, res, next) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    let user = await User.findById(_id);

    if (user) {
      res
        .status(200)
        .json({ success: true, message: `Welcome, ${user?.name}` });
      return;
    }

    if (!_id || !name || !email || !photo || !gender || !dob) {
      return next(new ErrorHandler("Please add all fields", 400));
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob: new Date(dob),
    });

    res.status(201).json({
      success: true,
      message: `Welcome, ${user?.name}`,
    });
  }
);

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

export const getUser: ControllerType<unknown, { id: string }> = TryCatch(
  async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return next(new ErrorHandler("Invalid ID", 400));

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const deleteUser: ControllerType<unknown, { id: string }> = TryCatch(
  async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return next(new ErrorHandler("Invalid ID", 400));

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  }
);
