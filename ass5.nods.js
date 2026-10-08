1. Folder Structure
2. Assignment5/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   └── index.js
│   │
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── post.controller.js
│   │   └── comment.controller.js
│   │
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── post.routes.js
│   │   └── comment.routes.js
│   │
│   └── app.js
│
├── bonus.js
├── package.json
└── .env


2. Database
   const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;


3. User Model
   const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,

      validate: {
        checkPasswordLength(value) {
          if (value.length <= 6) {
            throw new Error(
              "Password must be greater than 6 characters"
            );
          }
        },
      },
    },

    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },

    createdAt: {
      type: DataTypes.DATE,
    },

    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    hooks: {
      beforeCreate: (user) => {
        if (user.name.length <= 2) {
          throw new Error(
            "Name must be greater than 2 characters"
          );
        }
      },
    },
  }
);

module.exports = User;


4. Post Model
   const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class Post extends Model {}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
    },

    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "Post",
    paranoid: true,
  }
);

module.exports = Post;


5. Comment Model
   const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class Comment extends Model {}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
    },

    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "Comment",
  }
);

module.exports = Comment;


6. Associations
   const User = require("./User");
const Post = require("./Post");
const Comment = require("./Comment");

// User -> Posts
User.hasMany(Post, {
  foreignKey: "userId",
});

Post.belongsTo(User, {
  foreignKey: "userId",
});

// User -> Comments
User.hasMany(Comment, {
  foreignKey: "userId",
});

Comment.belongsTo(User, {
  foreignKey: "userId",
});

// Post -> Comments
Post.hasMany(Comment, {
  foreignKey: "postId",
});

Comment.belongsTo(Post, {
  foreignKey: "postId",
});

module.exports = {
  User,
  Post,
  Comment,
};


7. User APIs
   const { User } = require("../models");

// 1. POST /users/signup
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const user = User.build({
      name,
      email,
      password,
      role,
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


// 2. PUT /users/:id
const createOrUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [user, created] = await User.findOrCreate({
      where: { id },
      defaults: req.body,
      validate: false,
    });

    if (!created) {
      await user.update(req.body, {
        validate: false,
      });
    }

    res.json({
      message: created
        ? "User created"
        : "User updated",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


// 3. GET /users/by-email
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// 4. GET /user/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: {
        exclude: ["role"],
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  createOrUpdateUser,
  getUserByEmail,
  getUserById,
};


8. User Routes
   const express = require("express");

const {
  createUser,
  createOrUpdateUser,
  getUserByEmail,
  getUserById,
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/signup", createUser);

router.put("/:id", createOrUpdateUser);

router.get("/by-email", getUserByEmail);

router.get("/user/:id", getUserById);

module.exports = router;


9. Post APIs
    const { Post, User, Comment } = require("../models");

// 1. POST /posts
const createPost = async (req, res) => {
  try {
    const post = new Post(req.body);

    await post.save();

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


// 2. DELETE /posts/:postId
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.userId != userId) {
      return res.status(403).json({
        message: "Only the owner can delete this post",
      });
    }

    await post.destroy();

    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// 3. GET /posts/details
const getPostsDetails = async (req, res) => {
  try {
    const posts = await Post.findAll({
      attributes: ["id", "title"],

      include: [
        {
          model: User,
          attributes: ["id", "name"],
        },

        {
          model: Comment,
          attributes: ["id", "content"],
        },
      ],
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// 4. GET /posts/comment-count
const getPostsCommentCount = async (req, res) => {
  try {
    const posts = await Post.findAll({
      attributes: [
        "id",
        "title",
        [
          require("sequelize").fn(
            "COUNT",
            require("sequelize").col("Comments.id")
          ),
          "commentCount",
        ],
      ],

      include: [
        {
          model: Comment,
          attributes: [],
        },
      ],

      group: ["Post.id"],
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  deletePost,
  getPostsDetails,
  getPostsCommentCount,
};


10. Post Routes
    const express = require("express");

const {
  createPost,
  deletePost,
  getPostsDetails,
  getPostsCommentCount,
} = require("../controllers/post.controller");

const router = express.Router();

router.post("/", createPost);

router.delete("/:postId", deletePost);

router.get("/details", getPostsDetails);

router.get("/comment-count", getPostsCommentCount);

module.exports = router;


11. Comment APIs
    const { Op } = require("sequelize");
const { Comment, User, Post } = require("../models");

// 1. POST /comments
const createBulkComments = async (req, res) => {
  try {
    const comments = await Comment.bulkCreate(req.body);

    res.status(201).json({
      message: "Comments created successfully",
      comments,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


// 2. PATCH /comments/:commentId
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, content } = req.body;

    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (comment.userId != userId) {
      return res.status(403).json({
        message: "Only the owner can update this comment",
      });
    }

    comment.content = content;

    await comment.save();

    res.json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


// 3. POST /comments/find-or-create
const findOrCreateComment = async (req, res) => {
  try {
    const { postId, userId, content } = req.body;

    const [comment, created] =
      await Comment.findOrCreate({
        where: {
          postId,
          userId,
          content,
        },
        defaults: {
          postId,
          userId,
          content,
        },
      });

    res.json({
      created,
      comment,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


// 4. GET /comments/search
const searchComments = async (req, res) => {
  try {
    const { word } = req.query;

    const { count, rows } = await Comment.findAndCountAll({
      where: {
        content: {
          [Op.like]: %${word}%,
        },
      },
    });

    res.json({
      count,
      comments: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// 5. GET /comments/newest/:postId
const getNewestComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: {
        postId: req.params.postId,
      },

      order: [["createdAt", "DESC"]],

      limit: 3,
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// 6. GET /comments/details/:id
const getCommentDetails = async (req, res) => {
  try {
    const comment = await Comment.findByPk(
      req.params.id,
      {
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
          {
            model: Post,
          },
        ],
      }
    );

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createBulkComments,
  updateComment,
  findOrCreateComment,
  searchComments,
  getNewestComments,
  getCommentDetails,
};


12. Comment Routes
    const express = require("express");

const {
  createBulkComments,
  updateComment,
  findOrCreateComment,
  searchComments,
  getNewestComments,
  getCommentDetails,
} = require("../controllers/comment.controller");

const router = express.Router();

router.post("/", createBulkComments);

router.patch("/:commentId", updateComment);

router.post("/find-or-create", findOrCreateComment);

router.get("/search", searchComments);

router.get("/newest/:postId", getNewestComments);

router.get("/details/:id", getCommentDetails);

module.exports = router;


13. App.js
    const express = require("express");
const sequelize = require("./config/db");

require("./models");

const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");

const app = express();

app.use(express.json());

app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);

sequelize
  .sync()
  .then(() => {
    console.log("Database connected");

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((error) => {
    console.log(error);
  });


 
