const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    file_name: {
        type: String,
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    file_type: {
        type: String,
        required: true
    },
    document_type: {
        type: String,
        enum: [
            'passport',
            'visas',
            'work_permits',
            'certificates',
            'prior_applications',
            'tax_financials',
            'id_proof',
            'financial',
            'educational',
            'other',
            'client_upload'
        ],
        default: 'other'
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    application_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', documentSchema);
