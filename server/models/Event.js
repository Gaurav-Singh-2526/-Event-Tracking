import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: [true, 'session_id is required'],
      maxlength: 100,
      index: true,
    },
    event_type: {
      type: String,
      required: [true, 'event_type is required'],
      enum: { values: ['page_view', 'click'], message: 'event_type must be page_view or click' },
    },
    page_url: {
      type: String,
      required: [true, 'page_url is required'],
      maxlength: 2048,
    },
    // Normalized page (origin + pathname, no query/hash) used for heatmap grouping
    page: {
      type: String,
      required: true,
      maxlength: 2048,
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      index: true,
    },
    // Click and viewport metadata
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,   // adds createdAt, updatedAt
    versionKey: false,
  }
);

// Compound index for session event queries
eventSchema.index({ session_id: 1, timestamp: 1 });
// Index for page click queries (heatmap)
eventSchema.index({ page: 1, event_type: 1 });
// Index for analytics summary (recent events)
eventSchema.index({ timestamp: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
