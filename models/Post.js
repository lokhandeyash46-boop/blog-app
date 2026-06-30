const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters']
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    excerpt: {
      type: String,
      maxlength: [280, 'Excerpt cannot exceed 280 characters'],
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    coverImage: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    publishedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Full-text search support across title, excerpt and content
postSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

/**
 * Build a unique, URL-safe slug from the title before validation.
 * Appends a short suffix if a collision is found.
 */
postSchema.pre('validate', async function buildSlug(next) {
  if (!this.isModified('title') && this.slug) return next();

  const base = slugify(this.title, { lower: true, strict: true });
  let candidate = base;
  let suffix = 1;

  const Post = this.constructor;
  // Ensure slug uniqueness, excluding the current document on updates
  while (
    await Post.findOne({ slug: candidate, _id: { $ne: this._id } })
  ) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  this.slug = candidate;
  next();
});

// Set publishedAt the first time a post transitions to "published"
postSchema.pre('save', function setPublishedAt(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
