const AssistantConversation = require('../models/AssistantConversation')
const { generateCareerReply } = require('../services/careerAssistant')

const userId = req => req.user._id
function getProfile(req, res) {
  const profile = req.user.profile || {}
  return res.json({ profile: { skills: profile.skills || [], experience: profile.experience || '', targetRole: profile.targetRole || '', resumeSummary: profile.resumeSummary || '' } })
}

async function updateProfile(req, res, next) {
  const body = req.body || {}
  const skills = Array.isArray(body.skills) ? body.skills.filter(skill => typeof skill === 'string').map(skill => skill.trim()).filter(Boolean).slice(0, 40) : []
  const experience = typeof body.experience === 'string' ? body.experience.trim() : ''
  const targetRole = typeof body.targetRole === 'string' ? body.targetRole.trim() : ''
  const resumeSummary = typeof body.resumeSummary === 'string' ? body.resumeSummary.trim() : ''
  if (experience.length > 2000 || targetRole.length > 160 || resumeSummary.length > 4000 || skills.some(skill => skill.length > 80)) {
    return res.status(400).json({ error: 'Profile details exceed the allowed length.' })
  }
  try {
    req.user.profile.skills = skills
    req.user.profile.experience = experience
    req.user.profile.targetRole = targetRole
    req.user.profile.resumeSummary = resumeSummary
    await req.user.save()
    return getProfile(req, res)
  } catch (error) { return next(error) }
}

const serialize = conversation => ({
  id: conversation._id.toString(),
  title: conversation.title,
  language: conversation.language,
  messages: conversation.messages.map(message => ({ role: message.role, content: message.content, createdAt: message.createdAt })),
  updatedAt: conversation.updatedAt,
})

async function listConversations(req, res, next) {
  try {
    const conversations = await AssistantConversation.find({ user: userId(req) }).sort({ updatedAt: -1 }).limit(50).select('title language updatedAt messages').lean()
    return res.json({ conversations: conversations.map(conversation => ({ id: conversation._id.toString(), title: conversation.title, language: conversation.language, updatedAt: conversation.updatedAt, preview: conversation.messages.at(-1)?.content || '' })) })
  } catch (error) { return next(error) }
}

async function getConversation(req, res, next) {
  try {
    const conversation = await AssistantConversation.findOne({ _id: req.params.id, user: userId(req) })
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' })
    return res.json({ conversation: serialize(conversation) })
  } catch (error) { return next(error) }
}

async function createConversation(req, res, next) {
  try {
    const language = typeof req.body?.language === 'string' ? req.body.language.trim().slice(0, 40) : 'English'
    const conversation = await AssistantConversation.create({ user: userId(req), language, title: 'New career conversation' })
    return res.status(201).json({ conversation: serialize(conversation) })
  } catch (error) { return next(error) }
}

async function sendMessage(req, res, next) {
  const content = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  const language = typeof req.body?.language === 'string' ? req.body.language.trim().slice(0, 40) : 'English'
  if (!content || content.length > 4000) return res.status(400).json({ error: 'Enter a message of 1 to 4,000 characters.' })
  try {
    let conversation = req.params.id
      ? await AssistantConversation.findOne({ _id: req.params.id, user: userId(req) })
      : await AssistantConversation.create({ user: userId(req), title: content.slice(0, 72), language })
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' })
    conversation.language = language
    conversation.messages.push({ role: 'user', content })
    if (conversation.messages.length > 30) conversation.messages.splice(0, conversation.messages.length - 30)
    const history = conversation.messages.slice(-12).map(item => ({ role: item.role, content: item.content }))
    const reply = await generateCareerReply({ user: req.user, messages: history, language })
    conversation.messages.push({ role: 'assistant', content: reply })
    await conversation.save()
    return res.json({ conversation: serialize(conversation), reply })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    return next(error)
  }
}

async function deleteConversation(req, res, next) {
  try {
    const deleted = await AssistantConversation.findOneAndDelete({ _id: req.params.id, user: userId(req) })
    if (!deleted) return res.status(404).json({ error: 'Conversation not found.' })
    return res.json({ message: 'Conversation deleted.' })
  } catch (error) { return next(error) }
}

module.exports = { createConversation, deleteConversation, getConversation, getProfile, listConversations, sendMessage, updateProfile }
