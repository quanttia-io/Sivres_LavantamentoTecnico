-- ============================================================
-- PRSS SEED SQL - Rodar no Supabase SQL Editor
-- ============================================================

-- 1. USUARIOS (senhas: Admin@2026 / Gestor@2026 / Super@2026)
INSERT INTO users (id, email, password, name, role, active, "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'admin@prss.com.br',      '$2a$10$4dq.HiwXHvf21LxOt1SN7eEnwMxQCaeS8fapJ0CuowreV9IsKMn9m', 'Administrador',     'ADMINISTRADOR', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'gestor@prss.com.br',     '$2a$10$nFDhPL9UP3nvzL8ECrgL/u08NfGzich1qQ5JMZKnVYTWR0OW8D9Qu', 'Gestor Comercial',  'GESTOR',         true, NOW(), NOW()),
  (gen_random_uuid()::text, 'supervisor@prss.com.br', '$2a$10$jbVoiwERoislIbO7qqAS4Oay2xXzQrTwMiVO04EM3jvj0wpji1/Tm', 'Supervisor Tecnico','SUPERVISOR',     true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. PRODUTOS
INSERT INTO produtos (id, codigo, descricao, custo, ativo, "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text,'CAM-001','Camera IP Dome 2MP Infravermelho',350.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'CAM-002','Camera IP Bullet 4MP Infravermelho',480.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'CAM-003','Camera IP PTZ 2MP',1200.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'DVR-001','DVR 8 Canais Full HD',890.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'NVR-001','NVR 16 Canais 4K',1450.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'INT-001','Interfone IP HD',620.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'INT-002','Interfone Analogico 2 fios',280.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'CTL-001','Controladora de Acesso 2 Portas',780.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'CTL-002','Controladora de Acesso 4 Portas',1250.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'LKT-001','Leitor de Cartao RFID 125kHz',180.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'LKT-002','Leitor Biometrico Digital',450.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'TAG-001','Tag de Acesso Veicular (100 unid)',320.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'POR-001','Motor Portao Deslizante 1/3HP',890.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'POR-002','Motor Portao Basculante 1/4HP',680.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'SRV-001','Servidor de Monitoramento Mini PC',2200.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'NO-BREAK-001','No-Break 1500VA',650.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'RACK-001','Rack de Parede 12U',420.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'SW-001','Switch PoE 8 Portas Gerenciavel',580.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'TOT-001','Totem de Atendimento Remoto 21pol',3500.00,true,NOW(),NOW()),
  (gen_random_uuid()::text,'LED-001','Luminaria LED Guarita 50W',180.00,true,NOW(),NOW())
ON CONFLICT (codigo) DO UPDATE SET custo = EXCLUDED.custo, "updatedAt" = NOW();

-- 3. TEMPLATE ASSISTIDA + ITENS
WITH t AS (
  INSERT INTO templates (id, "tipoPortaria", nome, "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, 'ASSISTIDA', 'Portaria Assistida Padrao', NOW(), NOW())
  ON CONFLICT ("tipoPortaria") DO UPDATE SET nome = EXCLUDED.nome, "updatedAt" = NOW()
  RETURNING id
)
INSERT INTO template_itens (id, "templateId", "produtoId", quantidade)
SELECT gen_random_uuid()::text, t.id, p.id,
  CASE p.codigo WHEN 'CAM-001' THEN 4 WHEN 'DVR-001' THEN 1 WHEN 'INT-001' THEN 2
                WHEN 'NO-BREAK-001' THEN 1 WHEN 'RACK-001' THEN 1 WHEN 'LED-001' THEN 2 END
FROM t, produtos p
WHERE p.codigo IN ('CAM-001','DVR-001','INT-001','NO-BREAK-001','RACK-001','LED-001')
  AND p."deletedAt" IS NULL
ON CONFLICT ("templateId","produtoId") DO UPDATE SET quantidade = EXCLUDED.quantidade;

-- 3b. TEMPLATE AUTONOMA + ITENS
WITH t AS (
  INSERT INTO templates (id, "tipoPortaria", nome, "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, 'AUTONOMA', 'Portaria Autonoma Padrao', NOW(), NOW())
  ON CONFLICT ("tipoPortaria") DO UPDATE SET nome = EXCLUDED.nome, "updatedAt" = NOW()
  RETURNING id
)
INSERT INTO template_itens (id, "templateId", "produtoId", quantidade)
SELECT gen_random_uuid()::text, t.id, p.id,
  CASE p.codigo WHEN 'CAM-001' THEN 6 WHEN 'NVR-001' THEN 1 WHEN 'INT-001' THEN 4
                WHEN 'CTL-001' THEN 2 WHEN 'LKT-001' THEN 4 WHEN 'TAG-001' THEN 1
                WHEN 'TOT-001' THEN 1 WHEN 'SRV-001' THEN 1 WHEN 'NO-BREAK-001' THEN 2
                WHEN 'SW-001' THEN 1 WHEN 'RACK-001' THEN 1 END
FROM t, produtos p
WHERE p.codigo IN ('CAM-001','NVR-001','INT-001','CTL-001','LKT-001','TAG-001','TOT-001','SRV-001','NO-BREAK-001','SW-001','RACK-001')
  AND p."deletedAt" IS NULL
ON CONFLICT ("templateId","produtoId") DO UPDATE SET quantidade = EXCLUDED.quantidade;

-- 3c. TEMPLATE CONTROLE_ACESSO + ITENS
WITH t AS (
  INSERT INTO templates (id, "tipoPortaria", nome, "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, 'CONTROLE_ACESSO', 'Controle de Acesso Padrao', NOW(), NOW())
  ON CONFLICT ("tipoPortaria") DO UPDATE SET nome = EXCLUDED.nome, "updatedAt" = NOW()
  RETURNING id
)
INSERT INTO template_itens (id, "templateId", "produtoId", quantidade)
SELECT gen_random_uuid()::text, t.id, p.id,
  CASE p.codigo WHEN 'CAM-002' THEN 4 WHEN 'NVR-001' THEN 1 WHEN 'CTL-002' THEN 1
                WHEN 'LKT-002' THEN 4 WHEN 'POR-001' THEN 2 WHEN 'NO-BREAK-001' THEN 1
                WHEN 'SW-001' THEN 1 END
FROM t, produtos p
WHERE p.codigo IN ('CAM-002','NVR-001','CTL-002','LKT-002','POR-001','NO-BREAK-001','SW-001')
  AND p."deletedAt" IS NULL
ON CONFLICT ("templateId","produtoId") DO UPDATE SET quantidade = EXCLUDED.quantidade;

-- 4. CHECKLIST TEMPLATES
INSERT INTO checklist_templates (id, "tipoPortaria", ordem, pergunta, obrigatorio, "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text,'ASSISTIDA',1,'Existe ponto eletrico estabilizado para equipamentos?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',2,'Possui cabeamento estruturado ate a guarita?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',3,'Ha internet disponivel (minimo 10Mbps)?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',4,'Guarita possui iluminacao adequada?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',5,'Portoes possuem limite mecanico instalado?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',6,'Ha tomadas proximas aos portoes para motores?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',7,'Existe aterramento eletrico no local?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'ASSISTIDA',8,'O condominio possui planta/croqui disponivel?',false,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',1,'Existe link de internet dedicado no local?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',2,'Velocidade de internet e adequada (minimo 20Mbps)?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',3,'Ha local adequado para instalacao do totem?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',4,'Portoes possuem automacao instalada?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',5,'Existe no-break ou gerador no local?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',6,'Ha cobertura de sinal para comunicacao?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',7,'Moradores possuem aplicativo de acesso?',false,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',8,'Cameras tem campo de visao completo das entradas?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',9,'Existe iluminacao noturna adequada nas cameras?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'AUTONOMA',10,'Condominio possui sindico e contato definidos?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'CONTROLE_ACESSO',1,'Quantidade de pontos de controle mapeados?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'CONTROLE_ACESSO',2,'Cabeamento para leitores esta definido?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'CONTROLE_ACESSO',3,'Ha alimentacao eletrica nos pontos de leitura?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'CONTROLE_ACESSO',4,'Travas eletricas ou fechaduras eletronicas previstas?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'CONTROLE_ACESSO',5,'Sistema de monitoramento central definido?',true,NOW(),NOW()),
  (gen_random_uuid()::text,'CONTROLE_ACESSO',6,'Cronograma de cadastramento de usuarios acordado?',false,NOW(),NOW())
ON CONFLICT DO NOTHING;
