import { useEffect } from 'react'
import { serverUrl } from '../App'
import axios from 'axios'
import { setCreatorCourseData } from '../redux/courseSlice'
import { useDispatch, useSelector } from 'react-redux'

const getCreatorCourseData = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  useEffect(() => {
    const getCreatorData = async () => {
      if (!userData || userData.role !== 'educator') {
        return
      }
      try {
        const result = await axios.get(serverUrl + "/api/course/getcreatorcourses", { withCredentials: true })
        dispatch(setCreatorCourseData(result.data))
      } catch (error) {
        console.log(error)
      }
    }
    getCreatorData()
  }, [userData, dispatch])
}

export default getCreatorCourseData

