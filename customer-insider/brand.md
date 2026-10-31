# Seyi — Automation Guide

## Direction
A minimal, light conversation page inspired by the owner's Gemini screenshot. On a first visit, show the heading “Get Your Sales Automation Plan” with the smaller subtitle “Chat with Seyi and leave with practical steps to follow.” Center the composition vertically, with the heading and subtitle above the greeting and rounded input. Hide the heading and subtitle once the visitor begins the conversation. No decorative sketches, card frame, footer or first-screen navigation. After the visitor submits their name, reveal the normal conversation and two intent choices.

## Palette and surfaces
Near-white canvas (`#fdfcfe`), white paper, dark plum text (`#292331`), muted plum (`#746b80`), violet accent (`#7145bc`) and a soft lavender glow behind the input. The composer is a light gray pill (`#f3f3f6`) with a circular violet send button. The page stays light even when the device uses dark mode.

## Typography
Avenir Next / Segoe UI / Arial system stack. The heading has two lines: “Get Your Sales” in the system sans face, and “Automation Plan” in violet Georgia italic. It uses 36px on phones and up to 56px on desktop, with the italic line slightly larger. The subtitle is 13–14px, and the greeting is a centered 22–28px face. Input text is 16px for readability and to avoid mobile focus zoom. Conversation text stays comfortable and restrained. No external fonts.

## Interaction
The greeting is “Hi, I’m Seyi 👋 What’s your name?” and remains in the chat until the visitor replies. Text reveals one Unicode code point at a time: 36ms for the opening greeting and 18ms for other replies, making the greeting twice as slow. The name input appears as soon as chat metadata arrives. A visitor may type and submit while the greeting is animating; submission finishes the greeting and starts the next turn without losing their input. Reduced-motion users receive the text immediately. Existing conversations resume without replaying the first greeting.

## Voice
Warm, simple and personal. One wave emoji in the greeting. Ask for a name, then offer the approved learning and business paths. Keep the four learner questions, five business questions, saved answers and PDF email flows intact.
