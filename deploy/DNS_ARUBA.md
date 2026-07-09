# DNS Aruba per nuovo VPS

Usare questi record quando il nuovo VPS ha un IP pubblico.

## aliperlaliberta.it

| Tipo | Nome host | Valore |
| --- | --- | --- |
| A | @ | IP_DEL_NUOVO_VPS |
| CNAME | www | aliperlaliberta.it |
| A | api | IP_DEL_NUOVO_VPS |

Note:

- Non modificare i record `mx`: servono per la posta.
- Nel pannello attuale `www` punta a `aliperlaliberta.com`; cambiarlo a `aliperlaliberta.it`.
- Se Aruba mostra un redirect attivo sul record `@`, disattivarlo quando il sito viene servito dal VPS.

## apll.it

Se vuoi mantenere anche il dominio breve:

| Tipo | Nome host | Valore |
| --- | --- | --- |
| A | @ | IP_DEL_NUOVO_VPS |
| CNAME | www | apll.it |

Poi aggiungi `apll.it, www.apll.it` nel Caddyfile con un redirect verso `https://aliperlaliberta.it{uri}` oppure con una seconda root statica.
