tant: Now I need to update the application controller to populate these fields when creating applications.<edit_file>
<path>glojourn-frontend-main/backend/controllers/applicationController.js</path>
<content">  const application = await Case.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('client', 'name email');
=======
  const application = await Case.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('client', 'name email');
