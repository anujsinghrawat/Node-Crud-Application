import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId.toString())
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // console.log("The refresh token is", refreshToken, "and the access token is", accessToken    )
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {
        fullName,
        email,
        username,
        password,
    } = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Please provide all the details");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username: username.toLowerCase() }] },
    );

    if (existingUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    //what if cover image is not uploaded

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    // console.log("the avatar is", avatarLocalPath, "and coverpath is", coverImageLocalPath??"No cover image");
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath, (error, avatarUrl) => {
        if (error) {
            throw new ApiError(500, "An error occurred");
        }
    });
    console.log("The avatar url is", avatar.url);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath, (error, coverImageUrl) => {
        if (error) {
            throw new ApiError(500, "An error occurred");
        }
    }
    );
    console.log("The cover image url is", coverImage?.url || "No cover image", coverImage);

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }
    if (!coverImage) {
        console.log("Cover image upload failed")
    }

    const userDoc = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password,
    });

    if (!userDoc) {
        throw new ApiError(400, "User creation failed");
    }

    userDoc.password = undefined;
    userDoc.refreshToken = undefined;

    const user = userDoc.toObject();
    delete user.password;
    delete user.refreshToken;

    res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
    });

    const createdUser = User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(400, "User creation failed");
    }

    // return res.status(201).json(new ApiResponse(200, "User registered successfully", createdUser));
    return res.status(201).json(new ApiResponse(200, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
    //req.body destructuring
    const { email, username, password } = req.body;
    //username or email validation
    if (!email && !username) {
        throw new ApiError(400, "Please provide email or username");
    }

    //find the user
    const user = await User.findOne({ $or: [{ email }, { username }] });
    //compare password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }
    //generate token

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    //send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser.toObject(),
        accessToken,
        refreshToken
    }));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.headers("Authorization").replace("Bearer ", "");
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token expired or used");
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, "Access token refreshed successfully",
                {
                    accessToken,
                    refreshToken: newRefreshToken
                }));
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized");
    }

});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        });

    const options = {
        expires: new Date(Date.now() - 1000),
        httpOnly: true,
        secure: true
    };
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, "User logged out successfully"));

});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Please provide current and new password");
    }
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid current password");
    }
    user.password = newPassword;
    await user.save({
        validateBeforeSave: true
    });
    return res.status(200).json(new ApiResponse(200, "Password changed successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, "User fetched successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "Please provide all the details");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {
            new: true,
        }
    ).select("-password");
    return res.status(200).json(new ApiResponse(200, "Account details updated successfully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath, (error, avatarUrl) => {
        if (error) {
            throw new ApiError(500, "An error occurred");
        }
    });
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, "Avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please provide a cover image");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, (error, coverImageUrl) => {
        if (error) {
            throw new ApiError(500, "An error occurred");
        }
    });
    if (!coverImage) {
        throw new ApiError(400, "Cover image upload failed");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password");
    return res.status(200).json(new ApiResponse(200, "Cover image updated successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Please provide a username");
    }
    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: { $size: "$subscribers" },
                    channelsSubscribedToCount: { $size: "$subscribedTo" },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [req.user?._id, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    email: 1
                }
            }
        ]
    )
    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }
    return res.status(200)
        .json(new ApiResponse(200, "Channel fetched successfully", channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $arrayElemAt: ["$owner", 0]
                                }
                            }
                        }
                    ]
                }
            },
        ])

    if (!user?.length) {
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "Watch history fetched successfully", user[0].watchHistory));
});


export {
    registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser
    , updateAccountDetails, updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};