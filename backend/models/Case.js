const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    unique: true,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  visaType: {
    type: String,
    required: true,
    enum: ['tourist', 'business', 'student', 'work', 'family', 'other']
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'processing', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  applicationDetails: {
    destinationCountry: String,
    purposeOfVisit: String,
    intendedDateOfEntry: Date,
    intendedLengthOfStay: Number,
    accommodationDetails: String,
    financialInfo: {
      employmentStatus: String,
      monthlyIncome: Number,
      savings: Number
    }
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  deadlines: {
    submissionDeadline: Date,
    reviewDeadline: Date,
    approvalDeadline: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
caseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-generate case number before validation so "required" passes
caseSchema.pre('validate', async function(next) {
  if (this.isNew && !this.caseNumber) {
    const count = await mongoose.model('Case').countDocuments();
    this.caseNumber = `CASE-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Add timeline entry on status change
caseSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      updatedBy: this._updatedBy,
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);
