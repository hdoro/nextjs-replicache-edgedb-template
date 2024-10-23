import { type M, MUTATORS_CLIENT } from '@repo/lib/mutators/client'
import Cookies from 'js-cookie'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { Replicache, TEST_LICENSE_KEY } from 'replicache'

export function useReplicache({
  baseURL,
  licenseKey,
}: {
  baseURL: string
  licenseKey?: string
}) {
  const [rep, setRep] = useState<Replicache<M> | null>(null)

  useEffect(() => {
    let userID = Cookies.get('userID')
    if (!userID) {
      userID = nanoid()
      Cookies.set('userID', userID)
    }

    const replicache = new Replicache({
      name: userID,
      licenseKey: licenseKey || TEST_LICENSE_KEY,
      pushURL: `${baseURL}/replicache/push`,
      pullURL: `${baseURL}/replicache/pull`,
      mutators: MUTATORS_CLIENT,
      schemaVersion: '1.0',

      // FOR DEBUGGING:
      // requestOptions: {
      //   minDelayMs: 5000, // long time during dev to allow for easier debugging
      // },
      logLevel: 'debug',
    })

    setRep(replicache)

    return () => {
      void replicache.close()
    }
  }, [])

  return rep
}
