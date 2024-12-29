---
title: Redis cache decorator for hexagonal architecture in NestJS
speaker: Yosapol Jitrak; Sikkapat Sricheangsa
youtube: J10gI6G6-Zw
managed: true
published: '2025-02-18'
description: |
  We designed our system with a hexagonal architecture in NestJS. Our database is MongoDB. But we don't want to hit MongoDB with every request. We want to use cached data from Redis without changing a lot of our hexagonal code. Finally, we chose a decorator to solve this problem. We have 2 decorators. 1. Cache decorator 2. Invalid cache decorator

  Slides
  https://docs.google.com/presentation/d/e/2PACX-1vRdpkTV9l-nflcVs6xmur8pN6BUTwRzl8XN9vZnkj1x_fnZnOs1J34XvYkJdLcMPdPYd-X4fbq0HFqR/pub?start=false&loop=false&delayms=3000&slide=id.p

  Git Repository
  https://github.com/Eji4h/redis-cache-decorator-for-hexagonal-architecture-in-nestjs
subtitles: [th]
chapters:
  '00:00': 'แนะนำตัวและเกริ่นนำ Hexagonal Architecture กับ NestJS'
  '01:41': 'Decorator คืออะไร? เปรียบเทียบกับ Annotation และ Attribute'
  '02:42': 'Decorator ใน TypeScript และ NestJS'
  '03:05': 'ตัวอย่าง Decorator ใน NestJS: Controller, Get, Module, Injectable'
  '04:13': 'Hexagonal Architecture คืออะไร? (Ports and Adapters)'
  '05:18': 'Driving Side และ Driven Side - การเชื่อมต่อแบบ Port'
  '06:20': 'ข้อดีของ Hexagonal Architecture: ลด Coupling, เทสต์ง่าย, Logic ไม่กระจาย'
  '07:27': 'ตัวอย่างการ Implement Hexagonal Architecture ใน NestJS'
  '08:59': 'Demo Code: Controller, Use Case, Repository, Interface'
  '11:29': 'การ Map Object จาก Database กลับเป็น Domain Model และ Branded Type'
  '12:57': 'Branded Type คืออะไร? เพิ่มความ Strict ให้กับ Type'
  '14:25': 'ตัวอย่างการใช้ Branded Type ใน Domain Model'
  '15:16': 'ข้อดีของ Hexagonal Architecture: เปลี่ยน Database ได้ง่าย'
  '16:04': 'ปัญหา Caching ใน NestJS และ TTL'
  '17:52': 'Solution แรก: แก้ที่ Use Case (ข้อดีข้อเสีย)'
  '19:40': 'Solution ที่สอง: แก้ที่ MongoDB Repository (ข้อดีข้อเสีย)'
  '20:41': 'Final Solution: ใช้ Decorator สำหรับ Caching'
  '21:47': 'Decorator สำหรับ Method ของ Class ทำงานอย่างไร'
  '23:10': 'ตัวอย่าง Decorator Memorize'
  '24:06': 'Caching Decorator ทำงานอย่างไร'
  '24:38': 'Invalidating Cache Decorator ทำงานอย่างไร'
  '25:01': 'ตัวอย่าง Key Combination สำหรับ Caching'
  '25:37': 'Demo Code: Repository, Base Key, Key Combination'
  '26:56': 'Demo Code: Caching Decorator Implementation'
  '28:55': 'Demo Code: Setting and Getting Cache'
  '29:02': 'Demo Code: Unit Test สำหรับ Decorator'
  '30:27': 'Demo: ยิง Request ให้ดูการทำงานจริง'
  '34:34': 'สรุปและข้อจำกัดของ Caching Decorator'
  '36:15': 'ปัญหา Key ที่ใช้ในการ Search เปลี่ยนแปลงได้'
  '36:41': 'ผลลัพธ์หลังจาก Implement Caching Decorator: Load ลดลง, ราคาลดลง'
  '36:54': 'ช่วงขายของ: Course RESTful API by NestJS'
  '37:18': 'Q&A: REST Client Plugin ใน VS Code'
---
