
## Benchmark de carga

`pnpm native:test:audio-load` simula 16 mixagens em 48 kHz por 30 segundos de áudio, mede cada lote de callback e exige p99 abaixo de 80% do orçamento do buffer. No Sandbox, o caso de referência de 128 frames teve p50 de 0,0756 ms, p95 de 0,0803 ms e p99 de 0,0831 ms, contra orçamento de 2,6667 ms.

Esse número mede somente CPU do mixer em uma máquina virtualizada. Não mede captura, driver, scheduler, USB, Wi-Fi, jitter, conversão de sample rate ou latência ponta a ponta.
