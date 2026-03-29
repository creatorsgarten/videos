---
title: ผ่าโครงสร้างสถาปัตยกรรมความปลอดภัย OpenClaw
speaker: Sathapon Patanakuha
type: talk
youtube: 4B4IxfqVXQo
managed: true
description: ในยุคที่ AI ไม่ได้เป็นแค่แชทบอท แต่กลายเป็น "Agent" ที่ทำงานแทนเราได้ ความท้าทายใหม่ที่น่ากลัวที่สุดคือเรื่อง "ความปลอดภัย" โดยเมื่อเราส่งต่อ "สิทธิ์" ในการตัดสินใจและเข้าถึงข้อมูลให้ AI สิ่งที่ต้องระวังไม่ใช่แค่การถูกแฮ็กระบบแบบเดิม แต่คือการที่ AI ถูกปั่น จนเป็นอันตรายต่อผู้ใช้งาน วีดิโอคลิปนี้จะพาคุณไปสำรวจสถาปัตยกรรมความปลอดภัยและรูปแบบการโจมตี AI ในอนาคต
published: '2026-03-26'
language: th
subtitles:
  - th
chapters:
  '0:00': Architecture ของ OpenClaw (การทำงานจาก Gateway สู่ Agent และ External)
  '0:56': Attack Surface (การโจมตีมักมาจากภายนอกเจาะเข้า Prompt, Tools และ Model)
  '1:37': การโจมตีระดับ Prompt (Prompt Injection เพื่อหลอกดึง System Prompt หรือซ่อนคำสั่ง)
  '2:22': การโจมตีระดับ Tools (หลอกให้เครื่องมือรันสคริปต์อันตรายหรือทำงานเกินคำสั่ง)
  '3:08': การโจมตีระดับ Model (Reasoning Drift และการทำ Context Overflow เพื่อเบี่ยงเบนการทำงาน)
  '4:17': Supply Chain Attack (ระวังโค้ดอันตรายหรือมัลแวร์ที่แฝงมากับ Tools และ Skills)
  '4:49': DDoS และ Token Burning (หลอกให้ Agent เข้า Infinite Loop เพื่อผลาญทรัพยากรและ Token)
  '5:35': แนวทางการป้องกัน Agent และบริการจาก GuardianAI
---
