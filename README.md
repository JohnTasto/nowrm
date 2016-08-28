# notnow

#### Automate removal of now deployments.

Usage: `notnow [options]`

| Option | Description |
| ---------- | ---------- |
| `-y, --yes` | automatically confirm removal |
| `-o, --old' | ignore latest deployment of each project |
| `-k, --keep <projects/hashes>` | ignore specified projects and deployments |

#### Examples:

- Prompt for each deployment individually:  
`$ notnow`

- Remove all deployments:  
`$ notnow --yes`

- Remove all deployments except those specified:  
`$ notnow --yes --keep <project1>,<hash1>,<hash2>`
