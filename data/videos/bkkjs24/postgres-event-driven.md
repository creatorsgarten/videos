---
title: Bun, TypeScript and Postgres Building Reliable Event-Driven Systems Without Kafka by Dheerapat Tookkane
speaker: Dheerapat Tookkane
type: talk
youtube: txM_9nznYLs
managed: true
published: '2026-04-14'
language: th
description: |-
  พบกับคุณเอฟ Software Engineer จากเต่าบิน ที่จะมาแชร์เทคนิคการสร้าง event-driven application ด้วย Bun, TypeScript และ Postgres โดยไม่ต้องอาศัย message broker อย่าง Kafka หรือ RabbitMQ ในการจัดการระบบ

  คุณเอฟอธิบายถึงข้อดีและข้อเสียของการใช้ตารางใน Postgres เพื่อเก็บ event แทนการใช้ infrastructure ภายนอก ซึ่งช่วยให้เกิด transactional consistency ได้อย่างตรงไปตรงมา พร้อมทั้งแนะนำการใช้แพ็กเกจ pg-boss ร่วมกับ Elysia และ Kysely เพื่อจัดการคิวและป้องกันปัญหา race condition สำหรับ worker ที่ทำงานพร้อมกันหลายๆ ตัว นอกจากนี้ยังมีการสาธิตการขยายระบบหรือ scale ตัวแอปพลิเคชันอย่างง่าย
subtitles:
  - th
chapters:
  '0:00': 'แนะนำหัวข้อ: ใช้ Postgres สร้าง Event-driven app แทน Kafka หรือ RabbitMQ'
  '2:17': ปัญหาของ Message Broker ทั่วไปคือการขาด Transactional Consistency
  '3:28': เก็บ Event ลงใน Database Transaction เดียวกันเพื่อการันตี Consistency
  '4:48': แก้ปัญหาคิวซ้ำซ้อน (Race Condition) ด้วย SKIP LOCKED และ NOTIFY
  '6:50': ใช้ไลบรารี pg-boss จัดการ Queue ทรงพลังโดยไม่ต้องมัดคิวรีเอง
  '8:06': วิธีการรันคำสั่ง Insert และ Publish Event ให้อยู่ใน Transaction เดียวกัน
  '9:48': ใช้งาน Kysely ช่วยจัดการ Transaction และป้องกัน Error ด้วย Rollback อัตโนมัติ
  '11:33': 'การจัดการ Dead Letter: ดึง Job ที่พังกลับมาทำใหม่ได้อย่างง่ายดาย'
  '14:21': 'เพิ่ม Replica: เพิ่มจำนวน Worker ได้ทันทีโดยไม่ต้องแยก App'
  '16:59': 'เดโม Scale ระบบ: จ่ายงาน 100 Request พร้อมกันผ่าน 6 Instances'
  '20:35': 'ข้อดี: ได้ Consistency แบบฟรีๆ ลดภาระการดูแล Infrastructure สำหรับโปรเจกต์ขนาดเล็ก'
  '22:24': 'ข้อจำกัด: รับ Throughput เยอะหลักพันไม่ได้ และมีข้อจำกัดในการทำ Event Sourcing'
  '24:33': 'Q&A: หากรับ Request ปริมาณมากเกินไประบบจะค้าง ควรจัดการ Connection Pool ให้ดี'
  '27:00': 'Q&A: วางโครงสร้างผ่าน Clean Architecture เผื่อย้ายระบบไปยัง Message Broker จริงในอนาคต'
---
