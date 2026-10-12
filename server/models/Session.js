import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 100,
    },
    started_at: {
      type: Date,
      required: true,
    },
    last_activity_at: {
      type: Date,
      required: true,
      index: true,
    },
    total_events: {
      type: Number,
      default: 0,
      min: 0,
    },
    page_views: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    pages_visited: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
