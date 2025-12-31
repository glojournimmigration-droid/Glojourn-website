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
  intakeForm: {
    type: {
      generalInformation: {
        fullLegalName: { type: String, required: true, default: 'Not Provided' },
        otherNames: String,
        dateOfBirth: Date,
        birthCityCountry: String,
        citizenshipCountries: [String],
        gender: String,
        maritalStatus: String,
        address: {
          city: String,
          state: String,
          zip: String,
          country: String
        },
        phoneMobile: String,
        phoneOther: String,
        email: String,
        preferredContactMethod: String,
        preferredContactOther: String
      },
      immigrationHistory: {
        beenToUS: Boolean,
        lastEntryDate: Date,
        lastEntryPlace: String,
        mannerOfLastEntry: String,
        classOfAdmission: String,
        i94Number: String,
        currentStatus: String,
        entries: [
          {
            entryDate: Date,
            entryPlace: String,
            entryManner: String
          }
        ]
      },
      passportInformation: {
        passportCountry: String,
        passportNumber: String,
        issuedDate: Date,
        expirationDate: Date,
        placeOfIssue: String,
        alienNumber: String,
        ssn: String
      },
      educationEmployment: {
        highestEducation: String,
        educationList: [
          {
            school: String,
            degreeField: String,
            country: String,
            yearsFrom: String,
            yearsTo: String
          }
        ],
        currentEmployer: {
          companyName: String,
          position: String,
          startDate: Date,
          address: String,
          workContact: String
        },
        previousEmployment: String
      },
      consultation: {
        purposes: [String],
        otherPurpose: String,
        description: String,
        howHeard: String,
        howHeardOther: String
      },
      documentsProvided: {
        passport: Boolean,
        visas: Boolean,
        workPermits: Boolean,
        certificates: Boolean,
        priorApplications: Boolean,
        taxFinancials: Boolean
      },
      acknowledgment: {
        agreed: { type: Boolean, default: false }
      }
    },
    default: () => ({
      generalInformation: {
        fullLegalName: 'Not Provided',
        otherNames: '',
        dateOfBirth: null,
        birthCityCountry: '',
        citizenshipCountries: [],
        gender: '',
        maritalStatus: '',
        address: { city: '', state: '', zip: '', country: '' },
        phoneMobile: '',
        phoneOther: '',
        email: '',
        preferredContactMethod: 'email',
        preferredContactOther: ''
      },
      immigrationHistory: {
        beenToUS: false,
        lastEntryDate: null,
        lastEntryPlace: '',
        mannerOfLastEntry: '',
        classOfAdmission: '',
        i94Number: '',
        currentStatus: '',
        entries: []
      },
      passportInformation: {
        passportCountry: '',
        passportNumber: '',
        issuedDate: null,
        expirationDate: null,
        placeOfIssue: '',
        alienNumber: '',
        ssn: ''
      },
      educationEmployment: {
        highestEducation: '',
        educationList: [{ school: '', degreeField: '', country: '', yearsFrom: '', yearsTo: '' }],
        currentEmployer: { companyName: '', position: '', startDate: null, address: '', workContact: '' },
        previousEmployment: ''
      },
      consultation: {
        purposes: [],
        otherPurpose: '',
        description: '',
        howHeard: '',
        howHeardOther: ''
      },
      documentsProvided: {
        passport: false,
        visas: false,
        workPermits: false,
        certificates: false,
        priorApplications: false,
        taxFinancials: false
      },
      acknowledgment: {
        agreed: false
      }
    })
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
