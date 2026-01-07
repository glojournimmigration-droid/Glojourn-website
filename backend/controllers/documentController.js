const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Case = require('../models/Case');
const {
    uploadBufferToCloudinary,
    deleteFromCloudinary,
    getSignedUrl,
    buildCaseFolder
} = require('../utils/cloudinary');

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { application_id, document_type } = req.body;
        const targetDocumentType = document_type || 'client_upload';

        // Check if application exists
        const application = await Case.findById(application_id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const allowedTypes = new Set([
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
        ]);

        if (document_type && !allowedTypes.has(document_type)) {
            return res.status(400).json({ message: 'Unsupported document type' });
        }

        // Check permissions (owner or staff)
        const privilegedRoles = ['admin', 'manager', 'coordinator'];
        if (application.client.toString() !== req.user._id.toString() && !privilegedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // If client uploading, ensure they indicated they can provide this doc type
        if (req.user.role === 'client' && document_type && application.intakeForm?.documentsProvided) {
            const canProvide = {
                passport: application.intakeForm.documentsProvided.passport,
                visas: application.intakeForm.documentsProvided.visas,
                work_permits: application.intakeForm.documentsProvided.workPermits,
                certificates: application.intakeForm.documentsProvided.certificates,
                prior_applications: application.intakeForm.documentsProvided.priorApplications,
                tax_financials: application.intakeForm.documentsProvided.taxFinancials
            };

            if (document_type in canProvide && !canProvide[document_type]) {
                return res.status(400).json({ message: 'You indicated you cannot provide this document type' });
            }
        }

        // Replace existing documents of the same type for this application
        const docsToReplace = await Document.find({ application_id, document_type: targetDocumentType });
        for (const doc of docsToReplace) {
            if (doc.cloudinary_public_id) {
                await deleteFromCloudinary(doc.cloudinary_public_id);
            } else if (doc.file_path && !doc.file_path.startsWith('http')) {
                try {
                    const absolutePath = path.isAbsolute(doc.file_path)
                        ? doc.file_path
                        : path.join(__dirname, '..', doc.file_path);
                    
                    await fs.promises.unlink(absolutePath).catch(err => {
                        if (err.code !== 'ENOENT') throw err;
                    });
                } catch (cleanupErr) {
                    console.warn('Failed to remove old document file:', cleanupErr.message);
                }
            }

            // Remove document reference from the application
            application.documents = (application.documents || []).filter(
                (id) => id.toString() !== doc._id.toString()
            );
            await doc.deleteOne();
        }

        const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
            folder: buildCaseFolder(application_id)
        });

        // Create document record
        const document = new Document({
            file_name: req.file.originalname,
            file_path: uploadResult.secure_url,
            file_url: uploadResult.secure_url,
            file_type: req.file.mimetype,
            file_size: req.file.size,
            document_type: targetDocumentType,
            uploaded_by: req.user._id,
            application_id,
            cloudinary_public_id: uploadResult.public_id
        });

        await document.save();

        // Add to application documents list
        application.documents.push(document._id);
        await application.save();

        const accessUrl = getSignedUrl(document.cloudinary_public_id);

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: {
                ...document.toObject(),
                access_url: accessUrl
            }
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    List documents for an application with signed URLs
// @route   GET /api/documents/application/:applicationId
// @access  Private (Client with ownership, Coordinator/Manager assigned, Admin)
exports.getDocumentsForApplication = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { applicationId } = req.params;

        const application = await Case.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const isOwner = application.client.toString() === req.user._id.toString();
        const privilegedRoles = ['admin', 'manager', 'coordinator'];

        if (!isOwner && !privilegedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const documents = await Document.find({ application_id: applicationId }).sort({ createdAt: -1 });
        const hydratedDocuments = documents.map((doc) => {
            const accessUrl = doc.cloudinary_public_id
                ? getSignedUrl(doc.cloudinary_public_id)
                : doc.file_url || doc.file_path;

            return {
                ...doc.toObject(),
                access_url: accessUrl
            };
        });

        res.json({ documents: hydratedDocuments });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Request a document from a client
// @route   POST /api/document-requests
// @access  Private (Manager, Admin, Coordinator)
exports.requestDocument = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { application_id, document_type, message } = req.body;

        const application = await Case.findById(application_id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Add note to case timeline/notes about the request
        application.notes.push({
            content: `Document Requested: ${document_type}. Message: ${message || 'No message'}`,
            createdBy: req.user._id
        });

        // In a real app, send email notification here

        await application.save();

        res.json({ message: 'Document request sent successfully' });
    } catch (error) {
        console.error('Request document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get document requests for a user
// @route   GET /api/document-requests
// @access  Private
exports.getDocumentRequests = async (req, res) => {
    try {
        // Find application for this user
        // If staff, they might provide application_id query param? 
        // For now, let's assume this is primarily for the client to see THEIR requests.

        let query = {};
        if (req.user.role === 'client') {
            query.client = req.user._id;
        } else {
            // If staff, we likely need an application_id in query
            if (req.query.application_id) {
                query._id = req.query.application_id;
            } else {
                return res.status(400).json({ message: 'Application ID required for staff' });
            }
        }

        const application = await Case.findOne(query).populate('notes.createdBy', 'name role');

        if (!application) {
            return res.json({ requests: [] });
        }

        // Filter notes that look like document requests
        // Format: "Document Requested: {type}. Message: {msg}"
        const Requests = application.notes
            .filter(note => note.content && note.content.startsWith('Document Requested:'))
            .map(note => {
                // Parse content
                const content = note.content;
                const typeMatch = content.match(/Document Requested: (.*?)\./);
                const msgMatch = content.match(/Message: (.*)/);

                return {
                    id: note._id,
                    document_type: typeMatch ? typeMatch[1] : 'Unknown',
                    message: msgMatch ? msgMatch[1] : '',
                    created_at: note.createdAt,
                    created_by: note.createdBy
                };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ requests: Requests });
    } catch (error) {
        console.error('Get document requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
