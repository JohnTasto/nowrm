# nowrm

#### Automate removal of [Zeit ▲now](https://zeit.co/now) deployments.

Usage: `nowrm [options]`

| Option | Description |
| ---------- | ---------- |
| `-y, --yes` | automatically confirm removal |
| `-o, --old` | ignore latest deployment of each project |
| `-k, --keep <projects/hashes>` | ignore specified projects and deployments |

#### Examples:

- Prompt for each deployment individually:  
`$ nowrm`

- Remove all deployments:  
`$ nowrm --yes`

- Remove all deployments except those specified:  
`$ nowrm --yes --keep <project1>,<hash1>,<hash2>`
